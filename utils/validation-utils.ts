import { ExpenseItem, ExpenseCategory, DailyRecord, ExpenseStructureItem, CustomExpenseStructure, BackupData } from '../types';

export const isExpenseItem = (obj: any): obj is ExpenseItem => {
    if (!obj || typeof obj.id !== 'string' || typeof obj.name !== 'string' || typeof obj.amount !== 'number') {
        return false;
    }
    // For backward compatibility with old backups (billPhoto: string)
    const hasOldPhoto = typeof obj.billPhoto === 'string' || typeof obj.billPhoto === 'undefined';
    // For new format (billPhotos: string[])
    const hasNewPhotos = typeof obj.billPhotos === 'undefined' || (Array.isArray(obj.billPhotos) && obj.billPhotos.every(p => typeof p === 'string'));
    
    return hasOldPhoto && hasNewPhotos;
};

export const isExpenseCategory = (obj: any): obj is ExpenseCategory => {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && Array.isArray(obj.items) && obj.items.every(isExpenseItem);
};

export const isDailyRecord = (obj: any): obj is DailyRecord => {
    return obj && typeof obj.id === 'string' && typeof obj.date === 'string' && typeof obj.totalSales === 'number' && Array.isArray(obj.expenses) && obj.expenses.every(isExpenseCategory);
};

export const isExpenseStructureItem = (obj: any): obj is ExpenseStructureItem => {
    return obj && typeof obj.name === 'string' && typeof obj.defaultValue === 'number';
}

export const isCustomStructure = (obj: any): obj is CustomExpenseStructure => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    // Check if it's the new format or an empty object
    return Object.values(obj).every(val => Array.isArray(val) && val.every(item => isExpenseStructureItem(item))) ||
    // Check if it's the old format (for legacy restore)
    Object.values(obj).every(val => Array.isArray(val) && val.every(item => typeof item === 'string'));
};

export const isBackupData = (obj: any): obj is BackupData => {
    return obj && 
        typeof obj.version === 'number' && 
        Array.isArray(obj.records) && 
        obj.records.every(isDailyRecord) && 
        isCustomStructure(obj.customStructure);
}