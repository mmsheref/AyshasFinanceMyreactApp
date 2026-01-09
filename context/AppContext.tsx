
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData, ReportCardVisibilitySettings, GasConfig, GasLog } from '../types';
import * as db from '../utils/db';
import { migrateStructure, runMigration } from '../utils/migrations';
import { DEFAULT_EXPENSE_STRUCTURE, CATEGORIES_WITH_BILL_UPLOAD } from '../constants';
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

const DEFAULT_GAS_CONFIG: GasConfig = {
    currentStock: 0,
    cylindersPerBank: 2, // Default to 2 cylinders connected
};

interface AppContextType {
    records: DailyRecord[];
    sortedRecords: DailyRecord[];
    allSortedRecords: DailyRecord[];
    customStructure: CustomExpenseStructure;
    foodCostCategories: string[];
    billUploadCategories: string[];
    trackedItems: string[];
    reportCardVisibility: ReportCardVisibilitySettings;
    gasConfig: GasConfig;
    gasLogs: GasLog[];
    gasStats: { avgDaysPerCylinder: number; avgDailyUsage: number; daysSinceLastSwap: number };
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
    handleUpdateBillUploadCategories: (newCategories: string[]) => Promise<void>;
    handleUpdateTrackedItems: (newItems: string[]) => Promise<void>;
    handleUpdateReportCardVisibility: (newVisibility: ReportCardVisibilitySettings) => Promise<void>;
    handleUpdateGasConfig: (config: GasConfig) => Promise<void>;
    handleLogGasSwap: () => Promise<void>;
    handleGasRefill: (count: number) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [customStructure, setCustomStructure] = useState<CustomExpenseStructure>({});
    const [foodCostCategories, setFoodCostCategories] = useState<string[]>([]);
    const [billUploadCategories, setBillUploadCategories] = useState<string[]>([]);
    const [trackedItems, setTrackedItems] = useState<string[]>([]);
    const [reportCardVisibility, setReportCardVisibility] = useState<ReportCardVisibilitySettings>(DEFAULT_CARD_VISIBILITY);
    const [gasConfig, setGasConfig] = useState<GasConfig>(DEFAULT_GAS_CONFIG);
    const [gasLogs, setGasLogs] = useState<GasLog[]>([]);
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

                const dbBillUploadCats = await db.getSetting('billUploadCategories');
                if (dbBillUploadCats) setBillUploadCategories(dbBillUploadCats);
                else setBillUploadCategories(CATEGORIES_WITH_BILL_UPLOAD);
                
                const dbTrackedItems = await db.getSetting('trackedItems');
                if (dbTrackedItems) setTrackedItems(dbTrackedItems);

                const dbCardVisibility = await db.getSetting('reportCardVisibility');
                if (dbCardVisibility) setReportCardVisibility({ ...DEFAULT_CARD_VISIBILITY, ...dbCardVisibility });
                
                const dbGasConfig = await db.getSetting('gasConfig');
                if (dbGasConfig) setGasConfig(dbGasConfig);
                
                const dbGasLogs = await db.getGasLogs();
                setGasLogs(dbGasLogs || []);

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

    // --- Gas Calculations ---
    const gasStats = useMemo(() => {
        if (gasLogs.length < 2) {
            // Need at least 2 logs to calculate usage interval
            // Or 1 log + current date? Let's strictly calculate between known swaps for accuracy
            
            // Calculate Days since last swap
            let daysSinceLastSwap = 0;
            if (gasLogs.length === 1) {
                 const lastLog = new Date(gasLogs[0].date);
                 const today = new Date();
                 const diffTime = Math.abs(today.getTime() - lastLog.getTime());
                 daysSinceLastSwap = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return { avgDaysPerCylinder: 0, avgDailyUsage: 0, daysSinceLastSwap };
        }

        const sortedLogs = [...gasLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate total days between first and last log
        const firstLog = new Date(sortedLogs[0].date);
        const lastLog = new Date(sortedLogs[sortedLogs.length - 1].date);
        
        // Time span in days
        const diffTime = Math.abs(lastLog.getTime() - firstLog.getTime());
        const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // Cylinders consumed (Excluding the very first setup log if we assume start-state, 
        // but typically a log means "I finished X cylinders". 
        // So we sum up cylindersSwapped from index 1 to end (the usage during the period).
        // Actually, if I swap on Jan 1, and swap on Jan 5. 
        // That means I used the cylinders from Jan 1 during those 4 days.
        
        // Sum cylinders swapped from index 1 to end
        let totalCylindersUsed = 0;
        for (let i = 1; i < sortedLogs.length; i++) {
            totalCylindersUsed += sortedLogs[i].cylindersSwapped;
        }
        
        if (totalCylindersUsed === 0) return { avgDaysPerCylinder: 0, avgDailyUsage: 0, daysSinceLastSwap: 0 };

        const avgDaysPerCylinder = totalDays / totalCylindersUsed;
        const avgDailyUsage = totalCylindersUsed / totalDays;
        
        // Days since last swap
        const today = new Date();
        const lastSwapTime = Math.abs(today.getTime() - lastLog.getTime());
        const daysSinceLastSwap = Math.ceil(lastSwapTime / (1000 * 60 * 60 * 24));

        return { avgDaysPerCylinder, avgDailyUsage, daysSinceLastSwap };

    }, [gasLogs]);
    
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
        
        // Restore gas data if present
        if (data.gasConfig) {
            await db.saveSetting('gasConfig', data.gasConfig);
            setGasConfig(data.gasConfig);
        }
        if (data.gasLogs) {
             await db.clearGasLogs();
             await db.bulkAddGasLogs(data.gasLogs);
             setGasLogs(data.gasLogs);
        }

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

    const handleUpdateBillUploadCategories = async (newCategories: string[]) => {
        await db.saveSetting('billUploadCategories', newCategories);
        setBillUploadCategories(newCategories);
    };

    const handleUpdateTrackedItems = async (newItems: string[]) => {
        await db.saveSetting('trackedItems', newItems);
        setTrackedItems(newItems);
    }

    const handleUpdateReportCardVisibility = async (newVisibility: ReportCardVisibilitySettings) => {
        await db.saveSetting('reportCardVisibility', newVisibility);
        setReportCardVisibility(newVisibility);
    };

    // --- Gas Actions ---
    const handleUpdateGasConfig = async (config: GasConfig) => {
        await db.saveSetting('gasConfig', config);
        setGasConfig(config);
    };

    const handleLogGasSwap = async () => {
        // 1. Create Log
        const newLog: GasLog = {
            id: uuidv4(),
            date: new Date().toISOString(),
            cylindersSwapped: gasConfig.cylindersPerBank
        };
        await db.saveGasLog(newLog);
        
        // 2. Decrement Stock
        const newStock = Math.max(0, gasConfig.currentStock - gasConfig.cylindersPerBank);
        const newConfig = { ...gasConfig, currentStock: newStock };
        await db.saveSetting('gasConfig', newConfig);

        setGasLogs(prev => [...prev, newLog]);
        setGasConfig(newConfig);
    };

    const handleGasRefill = async (count: number) => {
        const newStock = gasConfig.currentStock + count;
        const newConfig = { ...gasConfig, currentStock: newStock };
        await db.saveSetting('gasConfig', newConfig);
        setGasConfig(newConfig);
    };


    const value: AppContextType = {
        records,
        sortedRecords,
        allSortedRecords,
        customStructure,
        foodCostCategories,
        billUploadCategories,
        trackedItems,
        reportCardVisibility,
        gasConfig,
        gasLogs,
        gasStats,
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
        handleUpdateBillUploadCategories,
        handleUpdateTrackedItems,
        handleUpdateReportCardVisibility,
        handleUpdateGasConfig,
        handleLogGasSwap,
        handleGasRefill,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
