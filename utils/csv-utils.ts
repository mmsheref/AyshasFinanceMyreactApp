import { DailyRecord } from '../types';

const escapeCsvField = (field: any): string => {
    const stringField = String(field ?? '');
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

const calculateTotalExpenses = (record: DailyRecord): number => {
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};

export const convertToCSV = (records: DailyRecord[]): string => {
    if (!records || records.length === 0) {
        return '';
    }

    const headers = [
        'Date',
        'Total Sales',
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

        const hasExpenses = record.expenses.some(cat => cat.items.length > 0);

        if (!hasExpenses) {
            // Handle records with no expenses
            const row = [
                record.date,
                record.totalSales,
                totalExpenses,
                profit,
                '', // Expense Category
                '', // Expense Item
                '', // Expense Amount
                'No' // Bill Photo Attached
            ].map(escapeCsvField);
            csvRows.push(row.join(','));
        } else {
            record.expenses.forEach(category => {
                if (category.items.length === 0) {
                    // This can happen if all items in a category were deleted.
                    // We can choose to represent this or ignore it. Let's ignore for a cleaner export.
                    return;
                }
                category.items.forEach(item => {
                    const row = [
                        record.date,
                        record.totalSales,
                        totalExpenses,
                        profit,
                        category.name,
                        item.name,
                        item.amount,
                        item.billPhoto ? 'Yes' : 'No'
                    ].map(escapeCsvField);
                    csvRows.push(row.join(','));
                });
            });
        }
    });

    return csvRows.join('\n');
};
