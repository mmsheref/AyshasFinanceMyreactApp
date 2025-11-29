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
 * Returns a date string (YYYY-MM-DD) calculated by subtracting 'days' from 'refDate'.
 * @param refDateStr The reference date string (YYYY-MM-DD).
 * @param days The number of days to subtract.
 */
export const subtractDays = (refDateStr: string, days: number): string => {
    const date = new Date(refDateStr + 'T00:00:00');
    date.setDate(date.getDate() - days);
    
    // Convert back to YYYY-MM-DD safely
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Gets the start and end date strings for "This Week" (Starts Sunday).
 */
export const getThisWeekRange = (): { start: string, end: string } => {
    const todayStr = getTodayDateString();
    const today = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    
    const startStr = subtractDays(todayStr, dayOfWeek);
    return { start: startStr, end: todayStr };
};

/**
 * Gets the start and end date strings for "Last Week" (Sun-Sat).
 */
export const getLastWeekRange = (): { start: string, end: string } => {
    const thisWeekStart = getThisWeekRange().start;
    const endStr = subtractDays(thisWeekStart, 1); // Last Saturday
    const startStr = subtractDays(endStr, 6); // Last Sunday
    return { start: startStr, end: endStr };
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