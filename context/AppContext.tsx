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
    customStructure: CustomExpenseStructure;
    foodCostCategories: string[];
    reportCardVisibility: ReportCardVisibilitySettings;
    isLoading: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
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
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

    useEffect(() => {
        const loadData = async () => {
            try {
                await db.openDB();

                const storedRecords = localStorage.getItem('ayshas-records');
                const storedStructure = localStorage.getItem('ayshas-custom-structure');

                if (storedRecords) {
                    console.log("Found data in localStorage, migrating to IndexedDB...");
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
                    console.log("Migration complete.");
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

                // Load food cost categories setting
                const dbFoodCostCats = await db.getSetting('foodCostCategories');
                if (dbFoodCostCats && Array.isArray(dbFoodCostCats)) {
                    setFoodCostCategories(dbFoodCostCats);
                } else {
                    // Set a smarter default that excludes 'Diary Expenses'
                    const defaultCats = ['Market Bills', 'Meat'];
                    await db.saveSetting('foodCostCategories', defaultCats);
                    setFoodCostCategories(defaultCats);
                }

                // Load report card visibility setting
                const dbCardVisibility = await db.getSetting('reportCardVisibility');
                if (dbCardVisibility) {
                    // Ensure new keys from default are added if they don't exist in saved settings
                    setReportCardVisibility({ ...DEFAULT_CARD_VISIBILITY, ...dbCardVisibility });
                } else {
                    await db.saveSetting('reportCardVisibility', DEFAULT_CARD_VISIBILITY);
                    setReportCardVisibility(DEFAULT_CARD_VISIBILITY);
                }
                
            } catch (error) {
                console.error("Failed to load data from database", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => root.classList.toggle('dark', mediaQuery.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);


    const sortedRecords = useMemo(() => 
        [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [records]
    );
    
    const getRecordById = (id: string) => records.find(r => r.id === id);

    const handleDelete = async (id: string) => {
        await db.deleteRecord(id);
        setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
    };

    const handleSave = async (record: DailyRecord, originalId?: string) => {
        const newId = record.id;
        // For a new record, originalId is undefined, so oldId will be the same as newId.
        // For an existing record, originalId is provided.
        const oldId = originalId || newId;

        // Prevent saving if the new date is already taken by a *different* record.
        if (newId !== oldId && records.some(r => r.id === newId)) {
            // This is a server-side check; the form should prevent this state.
            throw new Error('A record for this date already exists.');
        }
        
        // If the ID (date) has changed during an edit, we must remove the old record.
        if (newId !== oldId) {
            await db.deleteRecord(oldId);
        }
        // 'put' operation in IndexedDB will add or update the record.
        await db.saveRecord(record);

        setRecords(prevRecords => {
            // Remove the old record if its ID has changed or if it existed.
            const recordsWithoutOld = prevRecords.filter(r => r.id !== oldId);
            // Add the new/updated record.
            return [...recordsWithoutOld, record];
        });
    };
    
    const handleSaveCustomItem = async (categoryName: string, itemName: string, defaultValue: number) => {
        const newStructure = { ...customStructure };
        if (newStructure[categoryName] && !newStructure[categoryName].some(item => item.name === itemName)) {
            newStructure[categoryName] = [...newStructure[categoryName], { name: itemName, defaultValue: defaultValue }];
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
        
        alert(`Successfully imported ${data.records.length} records.`);

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
        customStructure,
        foodCostCategories,
        reportCardVisibility,
        isLoading,
        theme,
        setTheme,
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
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};