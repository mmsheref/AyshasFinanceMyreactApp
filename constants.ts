
import { v4 as uuidv4 } from 'uuid';
import { ExpenseCategory, CustomExpenseStructure } from './types';

export const FALLBACK_ITEM_COSTS: Record<string, number> = {
    "Morning Porotta Master": 1000,
    "Morning Tea Master": 700,
    "Morning Cleaning": 500,
    "Morning Supplier": 700,
    "Ameer": 1000,
    "Cook": 2000,
    "Kitchen Helper 1": 700,
    "Kitchen Cleaning": 500,
    "Night Porotta Master": 1200,
    "Night Tea Master (Abid)": 800,
    "Night Cleaning 1": 500,
    "Night Cleaning 2": 500,
    "Night Supplier 1 (Jerul)": 700,
    "Night Supplier 2 (Naga)": 700,
    "Night Supplier 3 (Tajir)": 700,
    "Night Supplier 4 (Noorsen)": 700,
    "Chinese Master": 900,
    "Alfaham Master": 800,
    "Sadik": 500,
    "Shabeer": 1200,
    "Potty": 750,
    "Beef": 4490,
    "Milk": 1050,
    "Banana Leaf (Ela)": 250,
    "Curd": 90,
    "Chappathi Supplier": 180,
    "Ediyappam": 240,
    "Appam": 240,
    "Snacks": 70,
    "Super Gas": 1552.5,
    "Daily Rent (Shop + Kitchen + Family Room)": 2333.3,
    "Electricity (Shop + Kitchen + Family Room)": 1266,
    "Water Bill": 200
};

// FIX: Corrected the type to Omit<ExpenseCategory, 'id'>[] to accurately reflect the structure, which includes the 'items' property. This fixes a downstream error in App.tsx.
export const DEFAULT_EXPENSE_STRUCTURE: Omit<ExpenseCategory, 'id'>[] = [
    { name: 'Market Bills', items: ['Kaduveli Ameer Muttom', 'Kaduveli Nasar Muttom', 'Vegetables', 'Plastics and Parcel', 'Kappa', 'Fruits'] },
    { name: 'Meat', items: ['Beef', 'Chicken', 'Potty', 'Fish'] },
    { name: 'Diary Expenses', items: ['Milk', 'Banana Leaf (Ela)', 'Curd', 'Ice', 'Dosa Maav Supplier 1 (Old)', 'Dosa Maav Supplier 2 (New)', 'Egg Supplier 1 (KLM)', 'Egg Supplier 2 (Ani)', 'Chappathi Supplier', 'Ediyappam', 'Appam', 'Snacks', 'Tea Powder'] },
    { name: 'Gas', items: ['Super Gas', 'Jinesh Gas'] },
    { name: 'Labours', items: ['Morning Porotta Master', 'Morning Tea Master', 'Morning Cleaning', 'Morning Supplier', 'Ameer', 'Cook', 'Kitchen Helper 1', 'Kitchen Cleaning', 'Night Porotta Master', 'Night Tea Master (Abid)', 'Night Cleaning 1', 'Night Cleaning 2', 'Night Supplier 1 (Jerul)', 'Night Supplier 2 (Naga)', 'Night Supplier 3 (Tajir)', 'Night Supplier 4 (Noorsen)', 'Chinese Master', 'Alfaham Master', 'Sadik', 'Shabeer', 'Vappa'] },
    { name: 'Fixed Costs', items: ['Daily Rent (Shop + Kitchen + Family Room)', 'Electricity (Shop + Kitchen + Family Room)', 'Water Bill'] }
].map(category => ({
    ...category,
    items: category.items.map(item => ({ name: item, amount: FALLBACK_ITEM_COSTS[item] || 0, id: uuidv4() }))
}));


export const generateNewRecordExpenses = (customStructure: CustomExpenseStructure): ExpenseCategory[] => {
    return Object.entries(customStructure).map(([categoryName, itemNames]) => ({
        id: uuidv4(),
        name: categoryName,
        items: itemNames.map(itemName => ({
            id: uuidv4(),
            name: itemName,
            amount: 0,
        }))
    }));
};
