
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
    gasStats: { avgDailyUsage: number; daysSinceLastSwap: number };
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
    handleLogGasSwap: (count: number) => Promise<void>;
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

                const storedRecords = await db.getAllRecords();
                // Run migrations
                const { migratedRecords, needsUpdate } = runMigration(storedRecords);
                if (needsUpdate) {
                    await db.bulkAddRecords(migratedRecords);
                    console.log('Database migrated successfully');
                }
                setRecords(migratedRecords);

                const storedStructure = await db.getCustomStructure();
                if (storedStructure) {
                    setCustomStructure(migrateStructure(storedStructure));
                } else {
                    setCustomStructure(DEFAULT_EXPENSE_STRUCTURE);
                }

                // Load Settings
                const storedFoodCost = await db.getSetting('foodCostCategories');
                if (storedFoodCost) setFoodCostCategories(storedFoodCost);
                else setFoodCostCategories(['Market Bills', 'Meat', 'Diary Expenses', 'Gas']);

                const storedBillUpload = await db.getSetting('billUploadCategories');
                if (storedBillUpload) setBillUploadCategories(storedBillUpload);
                else setBillUploadCategories(CATEGORIES_WITH_BILL_UPLOAD);

                const storedTrackedItems = await db.getSetting('trackedItems');
                if (storedTrackedItems) setTrackedItems(storedTrackedItems);

                const storedVisibility = await db.getSetting('reportCardVisibility');
                if (storedVisibility) setReportCardVisibility(storedVisibility);

                const storedGasConfig = await db.getSetting('gasConfig');
                if (storedGasConfig) setGasConfig(storedGasConfig);

                const storedGasLogs = await db.getGasLogs();
                // Sort logs desc
                setGasLogs(storedGasLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    const activeYearRecords = useMemo(() => {
        if (activeYear === 'all') return records;
        
        // Fiscal Year Logic (April to March)
        // e.g., '2023-2024' includes April 2023 to March 2024
        const [startYearStr, endYearStr] = activeYear.split('-');
        const startYear = parseInt(startYearStr);
        const endYear = parseInt(endYearStr);
        
        const startDate = `${startYear}-04-01`;
        const endDate = `${endYear}-03-31`;

        return records.filter(r => r.date >= startDate && r.date <= endDate);
    }, [records, activeYear]);

    const availableYears = useMemo(() => {
        if (records.length === 0) return [];
        const years = new Set<string>();
        records.forEach(r => {
            const date = new Date(r.date);
            const month = date.getMonth(); // 0-11
            const year = date.getFullYear();
            // If month is Jan-Mar (0-2), it belongs to previous fiscal year started in (year-1)
            // If month is Apr-Dec (3-11), it belongs to fiscal year started in (year)
            const fiscalStartYear = month < 3 ? year - 1 : year;
            years.add(`${fiscalStartYear}-${fiscalStartYear + 1}`);
        });
        return Array.from(years).sort().reverse();
    }, [records]);

    const sortedRecords = useMemo(() => {
        return [...activeYearRecords].sort((a, b) => b.date.localeCompare(a.date));
    }, [activeYearRecords]);

    const allSortedRecords = useMemo(() => {
        return [...records].sort((a, b) => b.date.localeCompare(a.date));
    }, [records]);
    
    // Gas Stats Calculation
    const gasStats = useMemo(() => {
        if (gasLogs.length === 0) return { avgDailyUsage: 0, daysSinceLastSwap: -1 };

        const lastSwap = new Date(gasLogs[0].date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastSwap.getTime());
        const daysSinceLastSwap = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

        // Calc Usage
        // Look at last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const recentLogs = gasLogs.filter(l => new Date(l.date) >= sixtyDaysAgo);
        
        let avgDailyUsage = 0;
        if (recentLogs.length > 0) {
            const totalSwapped = recentLogs.reduce((sum, l) => sum + l.cylindersSwapped, 0);
            
            // Time window is from first recent log to today
            const firstRecentLogDate = new Date(recentLogs[recentLogs.length - 1].date);
            const timeSpan = Math.max(1, Math.floor((today.getTime() - firstRecentLogDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            avgDailyUsage = totalSwapped / timeSpan;
        }

        return { avgDailyUsage, daysSinceLastSwap };
    }, [gasLogs]);


    const setActiveYear = async (year: string) => {
        setActiveYearInternal(year);
    };

    const getRecordById = (id: string) => {
        return records.find(r => r.id === id);
    };

    const handleSave = async (record: DailyRecord, originalId?: string) => {
        if (originalId && originalId !== record.id) {
            await db.deleteRecord(originalId);
            setRecords(prev => prev.filter(r => r.id !== originalId));
        }

        await db.saveRecord(record);
        
        setRecords(prev => {
            const exists = prev.some(r => r.id === record.id);
            if (exists) {
                return prev.map(r => r.id === record.id ? record : r);
            }
            return [...prev, record];
        });
    };

    const handleDelete = async (id: string) => {
        await db.deleteRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    const handleRestore = async (data: BackupData): Promise<number> => {
        await db.clearRecords();
        await db.bulkAddRecords(data.records);
        await db.saveCustomStructure(data.customStructure);

        // Load Optional Legacy Data
        if (data.gasLogs) {
            await db.clearGasLogs();
            await db.bulkAddGasLogs(data.gasLogs);
            setGasLogs(data.gasLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        if (data.gasConfig) {
            await db.saveSetting('gasConfig', data.gasConfig);
            setGasConfig(data.gasConfig);
        }

        setRecords(data.records);
        setCustomStructure(data.customStructure);
        return data.records.length;
    };

    const handleUpdateStructure = async (newStructure: CustomExpenseStructure) => {
        await db.saveCustomStructure(newStructure);
        setCustomStructure(newStructure);
    };

    const handleSaveCustomItem = async (categoryName: string, itemName: string, defaultValue: number) => {
        const newStructure = { ...customStructure };
        if (!newStructure[categoryName]) {
            newStructure[categoryName] = [];
        }
        // Avoid dupes
        if (!newStructure[categoryName].some(i => i.name === itemName)) {
             newStructure[categoryName] = [...newStructure[categoryName], { name: itemName, defaultValue }];
             await handleUpdateStructure(newStructure);
        }
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
    };

    const handleUpdateReportCardVisibility = async (newVisibility: ReportCardVisibilitySettings) => {
        await db.saveSetting('reportCardVisibility', newVisibility);
        setReportCardVisibility(newVisibility);
    };

    const handleUpdateGasConfig = async (config: GasConfig) => {
        await db.saveSetting('gasConfig', config);
        setGasConfig(config);
    };

    const handleLogGasSwap = async (count: number) => {
        const newStock = gasConfig.currentStock - count;
        // Don't allow negative stock for UI cleanliness, though logic handles it
        const finalStock = Math.max(0, newStock);
        
        const newConfig = { ...gasConfig, currentStock: finalStock };
        await handleUpdateGasConfig(newConfig);

        const newLog: GasLog = {
            id: uuidv4(),
            date: new Date().toISOString(),
            cylindersSwapped: count
        };
        await db.saveGasLog(newLog);
        setGasLogs(prev => [newLog, ...prev]);
    };

    const handleGasRefill = async (count: number) => {
        const newStock = gasConfig.currentStock + count;
        const newConfig = { ...gasConfig, currentStock: newStock };
        await handleUpdateGasConfig(newConfig);
    };

    return (
        <AppContext.Provider value={{
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
            setTheme: handleThemeChange,
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
            handleGasRefill
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
