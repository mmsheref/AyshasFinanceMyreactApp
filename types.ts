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
  morningSales: number;
  expenses: ExpenseCategory[];
}

export interface ExpenseStructureItem {
  name: string;
  defaultValue: number;
}

export type CustomExpenseStructure = {
  [categoryName: string]: ExpenseStructureItem[];
};

export interface BackupData {
  version: number;
  records: DailyRecord[];
  customStructure: CustomExpenseStructure;
}

export type ReportMetric = 
    | 'NET_PROFIT' | 'PROFIT_MARGIN' | 'PRIME_COST' 
    | 'TOTAL_SALES' | 'TOTAL_EXPENSES' | 'FOOD_COST' 
    | 'LABOR_COST' | 'AVG_DAILY_SALES' | 'AVG_DAILY_PROFIT' 
    | 'BUSIEST_DAY' | 'MOST_PROFITABLE_DAY' | 'LEAST_PROFITABLE_DAY';

export type ReportCardVisibilitySettings = {
    [key in ReportMetric]: boolean;
};