
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
  isClosed?: boolean; // New field to mark holidays/off days
}

export interface ExpenseStructureItem {
  name: string;
  defaultValue: number;
}

export type CustomExpenseStructure = {
  [categoryName: string]: ExpenseStructureItem[];
};

export interface GasConfig {
  currentStock: number; // Total full cylinders currently available
  cylindersPerBank: number; // How many are connected at a time (e.g., 2 connected)
}

export interface GasLog {
  id: string;
  date: string;
  cylindersSwapped: number; // How many were replaced (usually equals cylindersPerBank)
}

export interface BackupData {
  version: number;
  records: DailyRecord[];
  customStructure: CustomExpenseStructure;
  gasLogs?: GasLog[]; // Optional for backward compatibility
  gasConfig?: GasConfig;
}

export type ReportMetric = 
    | 'NET_PROFIT' | 'PROFIT_MARGIN' | 'PRIME_COST' 
    | 'TOTAL_SALES' | 'TOTAL_EXPENSES' | 'FOOD_COST' 
    | 'LABOR_COST' | 'AVG_DAILY_SALES' | 'AVG_DAILY_PROFIT' 
    | 'BUSIEST_DAY' | 'MOST_PROFITABLE_DAY' | 'LEAST_PROFITABLE_DAY';

export type ReportCardVisibilitySettings = {
    [key in ReportMetric]: boolean;
};
