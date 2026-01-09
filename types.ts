
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
  totalCylinders: number; // Total number of cylinders owned (Active + Full + Empty)
  currentStock: number; // Full cylinders currently in storage (Ready to use)
  cylindersPerBank: number; // Number of cylinders connected to the stove (Active)
}

export type GasLogType = 'USAGE' | 'REFILL';

export interface GasLog {
  id: string;
  date: string;
  type: GasLogType;
  count: number;
  cylindersSwapped?: number; // Legacy field, optional now
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
