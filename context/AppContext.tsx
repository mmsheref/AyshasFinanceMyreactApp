
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData, ReportCardVisibilitySettings } from '../types';
import * as db from '../utils/db';
import { migrateStructure, runMigration } from '../utils/migrations';
import { DEFAULT_EXPENSE_STRUCTURE } from '../constants';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark' | 'system';

const DEFAULT_CARD_VISIBILITY: ReportCardVisibilitySettings = {
    NET_PROFIT: true,
    PROFIT_MARGIN: true,
    PRIME_COST: true,
    TOTAL_SALES: true,
    TOTAL_EXPENSES: true,
    FOOD_COST: true,
    LABOR_COST: true,
    AVG_DAILY_SALES: true,
    AVG_DAILY_PROFIT: true,
    BUSIEST_DAY: true,
    MOST_PROFITABLE_DAY: true,
    LEAST_PROFITABLE_DAY: true,
};

interface AppContextType {
    records: DailyRecord[];
    sortedRecords: DailyRecord[];
    allSortedRecords: DailyRecord[];
    customStructure: CustomExpenseStructure;
    foodCostCategories: string[];
    reportCardVisibility: ReportCardVisibilitySettings;
    activeYear: string; // 'all' or 'YYYY'
    availableYears: string[];
    isLoading: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    setActiveYear: (year: string) => Promise<void>;
    getRecordById: (id: string) => DailyRecord | undefined;
    handleSave: (record: DailyRecord, originalId?: string) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleRestore: (data: BackupData) => Promise<number>;
    handleUpdateStructure: (newStructure: CustomExpenseStructure) => Promise<void>;
    handleSaveCustomItem: (categoryName: string, itemName: string, defaultValue: number) => Promise<void>;
    handleUpdateFoodCostCategories: (newCategories: string[]) => Promise<void>;
    handleUpdateReportCardVisibility: (newVisibility: ReportCardVisibilitySettings) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [customStructure, setCustomStructure] = useState<CustomExpenseStructure>({});
    const [foodCostCategories, setFoodCostCategories] = useState<string[]>([]);
    const [reportCardVisibility, setReportCardVisibility] = useState<ReportCardVisibilitySettings>(DEFAULT_CARD_VISIBILITY);
    const [activeYear, setActiveYearInternal] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

    useEffect(() => {
        const loadData = async () => {
            try {
                await db.openDB();

                const storedRecords = localStorage.getItem('ayshas-records');
                const storedStructure = localStorage.getItem('ayshas-custom-structure');

                if (storedRecords) {
                    const parsedRecords: DailyRecord[] = JSON.parse(storedRecords);
                    const { migratedRecords } = runMigration(parsedRecords);

                    let finalStructure = DEFAULT_EXPENSE_STRUCTURE;
                    if (storedStructure) {
                        const parsedStructure = JSON.parse(storedStructure);
                        finalStructure = migrateStructure(parsedStructure);
                    }
                    
                    await db.bulkAddRecords(migratedRecords);
                    await db.saveCustomStructure(finalStructure);
                    setRecords(migratedRecords);
                    setCustomStructure(finalStructure);
                    localStorage.removeItem('ayshas-records');
                    localStorage.removeItem('ayshas-custom-structure');
                } else {
                    const dbRecords = await db.getAllRecords();
                    const dbStructure = await db.getCustomStructure();
                    setRecords(dbRecords);
                    if (dbStructure) {
                        setCustomStructure(dbStructure);
                    } else {
                        const initialStructure = DEFAULT_EXPENSE_STRUCTURE;
                        setCustomStructure(initialStructure);
                        await db.saveCustomStructure(initialStructure);
                    }
                }

                // Settings
                const dbFoodCostCats = await db.getSetting('foodCostCategories');
                if (dbFoodCostCats) setFoodCostCategories(dbFoodCostCats);
                else setFoodCostCategories(['Market Bills', 'Meat']);

                const dbCardVisibility = await db.getSetting('reportCardVisibility');
                if (dbCardVisibility) setReportCardVisibility({ ...DEFAULT_CARD_VISIBILITY, ...dbCardVisibility });

                const dbActiveYear = await db.getSetting('activeYear');
                if (dbActiveYear) setActiveYearInternal(dbActiveYear);

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const allSortedRecords = useMemo(() => 
        [...records].sort((a, b) => b.date.localeCompare(a.date)),
        [records]
    );

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        records.forEach(r => years.add(r.date.split('-')[0]));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [records]);

    const sortedRecords = useMemo(() => {
        const base = activeYear === 'all' 
            ? records 
            : records.filter(r => r.date.startsWith(activeYear));
        return [...base].sort((a, b) => b.date.localeCompare(a.date));
    }, [records, activeYear]);
    
    const setActiveYear = async (year: string) => {
        await db.saveSetting('activeYear', year);
        setActiveYearInternal(year);
    };

    const getRecordById = (id: string) => records.find(r => r.id === id);

    const handleDelete = async (id: string) => {
        await db.deleteRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = async (record: DailyRecord, originalId?: string) => {
        const oldId = originalId || record.id;
        if (record.id !== oldId && records.some(r => r.id === record.id)) {
            throw new Error('A record for this date already exists.');
        }
        if (record.id !== oldId) await db.deleteRecord(oldId);
        await db.saveRecord(record);
        setRecords(prev => {
            const others = prev.filter(r => r.id !== oldId);
            return [...others, record];
        });
    };
    
    const handleSaveCustomItem = async (categoryName: string, itemName: string, defaultValue: number) => {
        const newStructure = { ...customStructure };
        if (newStructure[categoryName] && !newStructure[categoryName].some(item => item.name === itemName)) {
            newStructure[categoryName] = [...newStructure[categoryName], { name: itemName, defaultValue }];
            await db.saveCustomStructure(newStructure);
            setCustomStructure(newStructure);
        }
    };
    
    const handleRestore = async (data: BackupData): Promise<number> => {
        const { migratedRecords } = runMigration(data.records);
        const migratedStructure = migrateStructure(data.customStructure);
        await db.clearRecords();
        await db.bulkAddRecords(migratedRecords);
        await db.saveCustomStructure(migratedStructure);
        setRecords(migratedRecords);
        setCustomStructure(migratedStructure);
        return data.records.length;
    };

    const handleUpdateStructure = async (newStructure: CustomExpenseStructure) => {
        await db.saveCustomStructure(newStructure);
        setCustomStructure(newStructure);
    };
    
    const handleUpdateFoodCostCategories = async (newCategories: string[]) => {
        await db.saveSetting('foodCostCategories', newCategories);
        setFoodCostCategories(newCategories);
    };

    const handleUpdateReportCardVisibility = async (newVisibility: ReportCardVisibilitySettings) => {
        await db.saveSetting('reportCardVisibility', newVisibility);
        setReportCardVisibility(newVisibility);
    };

    const value: AppContextType = {
        records,
        sortedRecords,
        allSortedRecords,
        customStructure,
        foodCostCategories,
        reportCardVisibility,
        activeYear,
        availableYears,
        isLoading,
        theme,
        setTheme,
        setActiveYear,
        getRecordById,
        handleSave,
        handleDelete,
        handleRestore,
        handleUpdateStructure,
        handleSaveCustomItem,
        handleUpdateFoodCostCategories,
        handleUpdateReportCardVisibility,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
