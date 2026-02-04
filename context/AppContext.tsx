
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
    totalCylinders: 6, // Default total
    cylindersPerBank: 2, 
    currentStock: 0, // Legacy/Cache
};

interface GasState {
    currentStock: number;
    emptyCylinders: number;
    avgDailyUsage: number;
    daysSinceLastSwap: number;
    projectedDaysLeft: number;
}

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
    gasState: GasState;
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
    handleGasAction: (log: GasLog) => Promise<void>;
    handleDeleteGasLog: (id: string) => Promise<void>;
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
                
                const storedActiveYear = await db.getSetting('activeYear');
                if (storedActiveYear) setActiveYearInternal(storedActiveYear);

                const storedGasConfig = await db.getSetting('gasConfig');
                if (storedGasConfig) {
                    setGasConfig({ ...DEFAULT_GAS_CONFIG, ...storedGasConfig });
                }

                const storedGasLogs = await db.getGasLogs();
                // Normalize legacy logs (missing type/count)
                const normalizedLogs = storedGasLogs.map(log => ({
                    ...log,
                    type: log.type || 'USAGE', // Default old logs to Usage
                    count: log.count !== undefined ? log.count : (log.cylindersSwapped || 0)
                }));
                
                setGasLogs(normalizedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

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
        return records.filter(r => r.date.startsWith(activeYear));
    }, [records, activeYear]);

    const availableYears = useMemo(() => {
        if (records.length === 0) return [];
        const years = new Set<string>();
        records.forEach(r => {
            const year = r.date.substring(0, 4);
            years.add(year);
        });
        return Array.from(years).sort().reverse();
    }, [records]);

    const sortedRecords = useMemo(() => {
        return [...activeYearRecords].sort((a, b) => b.date.localeCompare(a.date));
    }, [activeYearRecords]);

    const allSortedRecords = useMemo(() => {
        return [...records].sort((a, b) => b.date.localeCompare(a.date));
    }, [records]);
    
    // --- Dynamic Gas State Calculation ---
    const gasState: GasState = useMemo(() => {
        // 1. Calculate Current Stock based on logs history
        // Sort chronologically for calculation (Oldest First)
        const chronoLogs = [...gasLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let calculatedStock = 0;

        chronoLogs.forEach(log => {
            if (log.type === 'REFILL') {
                calculatedStock += log.count;
            } else if (log.type === 'USAGE') {
                calculatedStock -= log.count;
            } else if (log.type === 'ADJUSTMENT') {
                calculatedStock = log.count; // Reset to specific value
            }
        });

        // Ensure stock doesn't go below zero visually (though mathematically it might if data is missing)
        // If stock is negative, it implies user forgot to log refills.
        const currentStock = calculatedStock; 

        // 2. Stats
        const usageLogs = gasLogs.filter(l => l.type === 'USAGE');
        
        let avgDailyUsage = 0;
        let daysSinceLastSwap = -1;
        let projectedDaysLeft = 0;

        if (usageLogs.length > 0) {
            // Days since last swap (Newest Usage Log)
            // gasLogs is already sorted Newest First
            const lastUsageLog = gasLogs.find(l => l.type === 'USAGE');
            if (lastUsageLog) {
                const lastSwapDate = new Date(lastUsageLog.date);
                const today = new Date();
                const diffTime = today.getTime() - lastSwapDate.getTime();
                daysSinceLastSwap = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            // Calc Avg Usage (Last 60 Days)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            
            const recentLogs = usageLogs.filter(l => new Date(l.date) >= sixtyDaysAgo);
            
            if (recentLogs.length > 1) {
                const totalSwapped = recentLogs.reduce((sum, l) => sum + l.count, 0);
                
                // Get range from first recent log to NOW
                const firstRecentLogDate = new Date(recentLogs[recentLogs.length - 1].date);
                const today = new Date();
                const timeSpan = Math.max(1, Math.floor((today.getTime() - firstRecentLogDate.getTime()) / (1000 * 60 * 60 * 24)));
                
                avgDailyUsage = totalSwapped / timeSpan;
            } else if (recentLogs.length === 1) {
                // If only 1 log recently, fallback to longer history or just that 1 log over days since
                const log = recentLogs[0];
                const daysSince = Math.max(1, Math.floor((new Date().getTime() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24)));
                avgDailyUsage = log.count / daysSince;
            }
        }

        // 3. Projected Days Left (based on current active bank + stock)
        if (avgDailyUsage > 0) {
            // Total gas available = Current Full Stock + Active (Approximated as 50% used? No, assume full capacity available from stock)
            // + Active bank is currently burning.
            // Let's assume Active Bank is 50% depleted on average, so we count Stock.
            // Simple projection: Stock / AvgUsage
            projectedDaysLeft = Math.floor(currentStock / avgDailyUsage);
        }

        const emptyCylinders = Math.max(0, (gasConfig.totalCylinders || 0) - (gasConfig.cylindersPerBank || 0) - Math.max(0, currentStock));

        return {
            currentStock: Math.max(0, currentStock), // UI shouldn't show negative
            emptyCylinders,
            avgDailyUsage,
            daysSinceLastSwap,
            projectedDaysLeft
        };
    }, [gasLogs, gasConfig]);


    const setActiveYear = async (year: string) => {
        await db.saveSetting('activeYear', year);
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
        
        // Run migration on restored records to ensure compatibility
        const { migratedRecords } = runMigration(data.records);
        
        await db.bulkAddRecords(migratedRecords);
        await db.saveCustomStructure(data.customStructure);

        // Load Optional Legacy Data
        if (data.gasLogs) {
            await db.clearGasLogs();
            const normalizedLogs = data.gasLogs.map(log => ({
                ...log,
                type: log.type || 'USAGE', 
                count: log.count !== undefined ? log.count : (log.cylindersSwapped || 0)
            }));
            await db.bulkAddGasLogs(normalizedLogs);
            setGasLogs(normalizedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        if (data.gasConfig) {
            await db.saveSetting('gasConfig', data.gasConfig);
            setGasConfig(data.gasConfig);
        }

        setRecords(migratedRecords);
        setCustomStructure(data.customStructure);
        return migratedRecords.length;
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

    // Unified Gas Action Handler (Add/Edit)
    const handleGasAction = async (log: GasLog) => {
        await db.saveGasLog(log);
        setGasLogs(prev => {
            // Remove existing if it's an edit, then add new
            const filtered = prev.filter(l => l.id !== log.id);
            const newList = [log, ...filtered];
            // Keep sorted new to old
            return newList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    };

    const handleDeleteGasLog = async (id: string) => {
        await db.deleteGasLog(id); // Assume this method exists in db.ts or add it
        setGasLogs(prev => prev.filter(l => l.id !== id));
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
            gasState,
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
            handleGasAction,
            handleDeleteGasLog
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
