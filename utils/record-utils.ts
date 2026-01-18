
import { DailyRecord, BackupData } from '../types';

/**
 * rounds a number to 2 decimal places to avoid floating point errors (e.g. 0.1 + 0.2 = 0.300000004)
 */
export const safeFloat = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the total expenses for a given daily record.
 * @param record The daily record to calculate expenses for.
 * @returns The sum of all expense item amounts in the record.
 */
export const calculateTotalExpenses = (record: DailyRecord): number => {
    if (!record || !record.expenses) {
        return 0;
    }
    const total = record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
    return safeFloat(total);
};

/**
 * Returns the current date as a YYYY-MM-DD string in the Local Timezone.
 * This prevents UTC-based date shifts (e.g., showing yesterday's date late at night).
 */
export const getTodayDateString = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

/**
 * Safely parses a YYYY-MM-DD string into a Date object at 00:00:00 local time.
 */
export const parseLocalDate = (dateStr: string): Date => {
    return new Date(dateStr + 'T00:00:00');
}

/**
 * Returns a date string (YYYY-MM-DD) calculated by subtracting 'days' from 'refDate'.
 * @param refDateStr The reference date string (YYYY-MM-DD).
 * @param days The number of days to subtract.
 */
export const subtractDays = (refDateStr: string, days: number): string => {
    const date = parseLocalDate(refDateStr);
    date.setDate(date.getDate() - days);
    
    // Convert back to YYYY-MM-DD safely
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Gets the start and end date strings for "Last 7 Days" (Rolling window).
 */
export const getLast7DaysRange = (): { start: string, end: string } => {
    const todayStr = getTodayDateString();
    const startStr = subtractDays(todayStr, 6); // Today is day 1, so subtract 6 for 7 days
    return { start: startStr, end: todayStr };
};

/**
 * Gets the start and end date strings for "This Month".
 */
export const getThisMonthRange = (): { start: string, end: string } => {
    const todayStr = getTodayDateString();
    const [year, month] = todayStr.split('-');
    const start = `${year}-${month}-01`;
    
    // End of month calculation
    const date = new Date(parseInt(year), parseInt(month), 0); // Last day of current month
    const endDay = String(date.getDate()).padStart(2, '0');
    const end = `${year}-${month}-${endDay}`;
    
    return { start, end };
};

/**
 * Gets the start and end date strings for "Last Month".
 */
export const getLastMonthRange = (): { start: string, end: string } => {
    const today = new Date();
    // Go to first day of current month, then subtract 1 day to get last day of prev month
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

    // Format manually to avoid timezone jumps
    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return { start: formatDate(lastMonthStart), end: formatDate(lastMonthEnd) };
};

/**
 * Formats a number into Indian Compact numbering system (Lakh/Crore)
 * @param amount - The number to format
 * @returns Formatted string (e.g., "1.5 Lakh", "4.2 Cr", "50,000")
 */
export const formatIndianNumberCompact = (amount: number): string => {
    const absVal = Math.abs(amount);
    if (absVal >= 10000000) {
        return `${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (absVal >= 100000) {
        return `${(amount / 100000).toFixed(2)} Lakh`;
    }
    return amount.toLocaleString('en-IN');
};

/**
 * Determines if the backup data is older than the current application data based on the latest record date.
 * @param currentRecords - The records currently in the app.
 * @param backupData - The backup data being imported.
 * @returns True if the backup's latest record is older than the app's latest record.
 */
export const isBackupOlderThanCurrent = (currentRecords: DailyRecord[], backupData: BackupData): boolean => {
    if (currentRecords.length === 0) return false;
    if (backupData.records.length === 0) return false;

    // Sort to find latest dates (Desc)
    const getLatestDate = (list: DailyRecord[]) => list.reduce((max, r) => r.date > max ? r.date : max, list[0].date);

    const appLatestDate = getLatestDate(currentRecords);
    const backupLatestDate = getLatestDate(backupData.records);

    return backupLatestDate < appLatestDate;
};
