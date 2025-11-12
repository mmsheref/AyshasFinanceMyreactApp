import { DailyRecord } from '../types';

/**
 * Calculates the total expenses for a given daily record.
 * @param record The daily record to calculate expenses for.
 * @returns The sum of all expense item amounts in the record.
 */
export const calculateTotalExpenses = (record: DailyRecord): number => {
    if (!record || !record.expenses) {
        return 0;
    }
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};
