
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
  isClosed?: boolean; // Holidays/off days
  isCompleted?: boolean; // New: True if the day is finalized, False if in-progress
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
  cylindersPerBank: number; // Number of cylinders connected to the stove (Active)
  // currentStock is now derived from logs, but we keep this field for legacy migration or as a cache if needed
  currentStock?: number; 
}

export type GasLogType = 'USAGE' | 'REFILL' | 'ADJUSTMENT';

export interface GasLog {
  id: string;
  date: string;
  type: GasLogType;
  count: number;
  notes?: string;
  cylindersSwapped?: number; // Legacy field
}

export interface BackupData {
  version: number;
  records: DailyRecord[];
  customStructure: CustomExpenseStructure;
  gasLogs?: GasLog[]; 
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
