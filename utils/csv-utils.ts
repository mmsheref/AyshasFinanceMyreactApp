import { DailyRecord } from '../types';
import { calculateTotalExpenses } from './record-utils';

const escapeCsvField = (field: any): string => {
    const stringField = String(field ?? '');
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const convertToCSV = (records: DailyRecord[]): string => {
    if (!records || records.length === 0) {
        return '';
    }

    const headers = [
        'Date',
        'Total Sales',
        'Morning Sales',
        'Night Sales',
        'Total Expenses',
        'Profit/Loss',
        'Expense Category',
        'Expense Item',
        'Expense Amount',
        'Bill Photo Attached'
    ];

    const csvRows: string[] = [headers.join(',')];
    const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedRecords.forEach(record => {
        const totalExpenses = calculateTotalExpenses(record);
        const profit = record.totalSales - totalExpenses;
        const morningSales = record.morningSales || 0;
        const nightSales = record.totalSales - morningSales;

        let isFirstRowForRecord = true;
        const allItems = record.expenses.flatMap(cat => cat.items.map(item => ({ ...item, categoryName: cat.name })));
        
        if (allItems.length === 0 || allItems.every(item => item.amount === 0)) {
            const row = [
                record.date, record.totalSales, morningSales, nightSales,
                totalExpenses, profit, 'N/A', 'N/A', 'N/A', 'No'
            ].map(escapeCsvField);
            csvRows.push(row.join(','));
            return;
        }

        allItems.forEach(item => {
            if (item.amount > 0) {
                 const row = [
                    isFirstRowForRecord ? record.date : '',
                    isFirstRowForRecord ? record.totalSales : '',
                    isFirstRowForRecord ? morningSales : '',
                    isFirstRowForRecord ? nightSales : '',
                    isFirstRowForRecord ? totalExpenses : '',
                    isFirstRowForRecord ? profit : '',
                    item.categoryName,
                    item.name,
                    item.amount,
                    (item.billPhotos && item.billPhotos.length > 0) ? 'Yes' : 'No'
                ].map(escapeCsvField);
                csvRows.push(row.join(','));
                isFirstRowForRecord = false;
            }
        });
    });

    return csvRows.join('\n');
};