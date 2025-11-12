import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData } from '../types';
import * as db from '../utils/db';
import { migrateStructure, runMigration } from '../utils/migrations';
import { DEFAULT_EXPENSE_STRUCTURE } from '../constants';

type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
    records: DailyRecord[];
    sortedRecords: DailyRecord[];
    customStructure: CustomExpenseStructure;
    isLoading: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    getRecordById: (id: string) => DailyRecord | undefined;
    handleSave: (record: DailyRecord) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleRestore: (data: BackupData) => Promise<number>;
    handleUpdateStructure: (newStructure: CustomExpenseStructure) => Promise<void>;
    handleSaveCustomItem: (categoryName: string, itemName: string, defaultValue: number) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [customStructure, setCustomStructure] = useState<CustomExpenseStructure>({});
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
                    return;
                }

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

    const handleSave = async (record: DailyRecord) => {
        const isEditing = records.some(r => r.id === record.id && r.date !== record.date); // ID is date, so this check is for edit vs new
        const exists = records.some(r => r.id === record.id);
        
        if (!isEditing && exists) {
            throw new Error('A record for this date already exists.');
        }

        await db.saveRecord(record);
        setRecords(prevRecords => {
            if (exists) {
                return prevRecords.map(r => (r.id === record.id ? record : r));
            } else {
                return [...prevRecords, record];
            }
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
        return data.records.length;
    };

    const handleUpdateStructure = async (newStructure: CustomExpenseStructure) => {
        await db.saveCustomStructure(newStructure);
        setCustomStructure(newStructure);
    };

    const value = {
        records,
        sortedRecords,
        customStructure,
        isLoading,
        theme,
        setTheme,
        getRecordById,
        handleSave,
        handleDelete,
        handleRestore,
        handleUpdateStructure,
        handleSaveCustomItem,
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