import { v4 as uuidv4 } from 'uuid';
import { ExpenseCategory, CustomExpenseStructure, ReportMetric } from './types';

/**
 * Defines which expense categories should show the "Add Bill Photo" button.
 * This makes the feature configurable and not hardcoded to a single category name.
 */
export const CATEGORIES_WITH_BILL_UPLOAD = [
    'Market Bills',
    'Meat',
    'Gas',
];

/**
 * The default structure for expenses, used to initialize the app for a new user.
 * This structure can be fully customized by the user in the settings.
 */
export const DEFAULT_EXPENSE_STRUCTURE: CustomExpenseStructure = {
    'Market Bills': [
        { name: 'Kaduveli Ameer Muttom', defaultValue: 0 },
        { name: 'Kaduveli Nasar Muttom', defaultValue: 0 },
        { name: 'Vegetables', defaultValue: 0 },
        { name: 'Plastics and Parcel', defaultValue: 0 },
        { name: 'Kappa', defaultValue: 0 },
        { name: 'Fruits', defaultValue: 0 }
    ],
    'Meat': [
        { name: 'Beef', defaultValue: 0 },
        { name: 'Chicken', defaultValue: 0 },
        { name: 'Potty', defaultValue: 0 },
        { name: 'Fish', defaultValue: 0 }
    ],
    'Diary Expenses': [
        { name: 'Milk', defaultValue: 0 },
        { name: 'Banana Leaf (Ela)', defaultValue: 0 },
        { name: 'Curd', defaultValue: 0 },
        { name: 'Ice', defaultValue: 0 },
        { name: 'Dosa Maav Supplier 1 (Old)', defaultValue: 0 },
        { name: 'Dosa Maav Supplier 2 (New)', defaultValue: 0 },
        { name: 'Egg Supplier 1 (KLM)', defaultValue: 0 },
        { name: 'Egg Supplier 2 (Ani)', defaultValue: 0 },
        { name: 'Chappathi Supplier', defaultValue: 0 },
        { name: 'Ediyappam', defaultValue: 0 },
        { name: 'Appam', defaultValue: 0 },
        { name: 'Snacks', defaultValue: 0 },
        { name: 'Tea Powder', defaultValue: 0 }
    ],
    'Gas': [
        { name: 'Super Gas', defaultValue: 0 },
        { name: 'Jinesh Gas', defaultValue: 0 }
    ],
    'Labours': [
        { name: 'Morning Porotta Master', defaultValue: 0 },
        { name: 'Morning Tea Master', defaultValue: 0 },
        { name: 'Morning Cleaning', defaultValue: 0 },
        { name: 'Morning Supplier', defaultValue: 0 },
        { name: 'Ameer', defaultValue: 0 },
        { name: 'Cook', defaultValue: 0 },
        { name: 'Kitchen Helper 1', defaultValue: 0 },
        { name: 'Kitchen Cleaning', defaultValue: 0 },
        { name: 'Night Porotta Master', defaultValue: 0 },
        { name: 'Night Tea Master (Abid)', defaultValue: 0 },
        { name: 'Night Cleaning 1', defaultValue: 0 },
        { name: 'Night Cleaning 2', defaultValue: 0 },
        { name: 'Night Supplier 1 (Jerul)', defaultValue: 0 },
        { name: 'Night Supplier 2 (Naga)', defaultValue: 0 },
        { name: 'Night Supplier 3 (Tajir)', defaultValue: 0 },
        { name: 'Night Supplier 4 (Noorsen)', defaultValue: 0 },
        { name: 'Chinese Master', defaultValue: 0 },
        { name: 'Alfaham Master', defaultValue: 0 },
        { name: 'Sadik', defaultValue: 0 },
        { name: 'Shabeer', defaultValue: 0 },
        { name: 'Vappa', defaultValue: 0 }
    ],
    'Fixed Costs': [
        { name: 'Daily Rent (Shop + Kitchen + Family Room)', defaultValue: 0 },
        { name: 'Electricity (Shop + Kitchen + Family Room)', defaultValue: 0 },
        { name: 'Water Bill', defaultValue: 0 }
    ]
};

/**
 * Generates a new set of expense categories and items based on the user's
 * custom structure, using the defined default values.
 * @param customStructure - The user-defined expense structure.
 * @returns An array of ExpenseCategory objects for a new record.
 */
export const generateNewRecordExpenses = (customStructure: CustomExpenseStructure): ExpenseCategory[] => {
    return Object.entries(customStructure).map(([categoryName, items]) => ({
        id: uuidv4(),
        name: categoryName,
        items: items.map(item => ({
            id: uuidv4(),
            name: item.name,
            amount: item.defaultValue || 0, // Use default value, fallback to 0
        }))
    }));
};

/**
 * A map of report metric keys to their user-friendly display names.
 */
export const METRIC_LABELS: Record<ReportMetric, string> = {
    NET_PROFIT: 'Net Profit',
    PROFIT_MARGIN: 'Profit Margin',
    PRIME_COST: 'Prime Cost %',
    TOTAL_SALES: 'Total Sales',
    TOTAL_EXPENSES: 'Total Expenses',
    FOOD_COST: 'Food Cost %',
    LABOR_COST: 'Labor Cost %',
    AVG_DAILY_SALES: 'Avg. Daily Sales',
    AVG_DAILY_PROFIT: 'Avg. Daily Profit',
    BUSIEST_DAY: 'Busiest Day (Sales)',
    MOST_PROFITABLE_DAY: 'Most Profitable Day',
    LEAST_PROFITABLE_DAY: 'Least Profitable Day',
};
