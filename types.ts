export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  billPhotos?: string[]; // base64 encoded image strings
}

export interface ExpenseCategory {
  id: string;
  name: string;
  items: ExpenseItem[];
}

export interface DailyRecord {
  id: string; // Using date as string 'YYYY-MM-DD' for simplicity and uniqueness
  date: string;
  totalSales: number;
  expenses: ExpenseCategory[];
}

export type CustomExpenseStructure = {
  [categoryName: string]: string[];
};

export interface BackupData {
  version: number;
  records: DailyRecord[];
  customStructure: CustomExpenseStructure;
}