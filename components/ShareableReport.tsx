import React from 'react';
import { DailyRecord, ExpenseCategory } from '../types';

interface ShareableReportProps {
  record: DailyRecord;
  id: string; // To target with html2canvas
}

const calculateTotalExpenses = (record: DailyRecord) => {
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};

const CategoryCard: React.FC<{ category: ExpenseCategory }> = ({ category }) => {
    const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
    const itemsWithAmount = category.items.filter(item => item.amount > 0);

    if (itemsWithAmount.length === 0) return null;

    // Use `break-inside-avoid` to prevent the card from splitting across columns.
    // Added `mb-4` for vertical spacing between cards.
    return (
        <div className="break-inside-avoid mb-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-t-md flex justify-between">
                {/* Removed truncate to allow wrapping */}
                <span className="pr-2">{category.name}</span>
                <span>₹{categoryTotal.toLocaleString('en-IN')}</span>
            </h4>
            <ul className="border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-md">
                {itemsWithAmount.map((item, index) => (
                    <li key={item.id} className={`px-2 py-1 flex justify-between items-center text-xs ${index < itemsWithAmount.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                        {/* Removed truncate and added break-words for long item names */}
                        <span className="text-slate-700 dark:text-slate-300 pr-2 break-words">{item.name}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100 flex-shrink-0">₹{item.amount.toLocaleString('en-IN')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ShareableReport: React.FC<ShareableReportProps> = ({ record, id }) => {
  const totalExpenses = calculateTotalExpenses(record);
  const profit = record.totalSales - totalExpenses;
  const morningSales = record.morningSales || 0;
  const nightSales = record.totalSales - morningSales;
  
  const categoriesWithExpenses = record.expenses.filter(category => 
    category.items.reduce((sum, item) => sum + item.amount, 0) > 0
  );
  
  return (
    // Set a fixed width for consistent rendering.
    <div id={id} className="p-6 bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100" style={{ width: '680px' }}>
      <div className="text-center pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-primary">Aysha's P&L Report</h1>
        <p className="text-md text-slate-600 dark:text-slate-300 mt-1">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Total Sales</p>
              <p className="text-xl font-bold text-primary">₹{record.totalSales.toLocaleString('en-IN')}</p>
            </div>
             <div className="text-[10px] space-y-0.5 text-left border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5">
                <p className="flex justify-between"><span>Morning:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">₹{morningSales.toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between"><span>Night:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">₹{nightSales.toLocaleString('en-IN')}</span></p>
            </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Total Expenses</p>
          <p className="text-xl font-bold text-error">₹{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{profit >= 0 ? 'Profit' : 'Loss'}</p>
          <p className={`text-xl font-bold ${profit >= 0 ? 'text-success' : 'text-error'}`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center mb-4">Expense Breakdown</h3>
        {/* Replaced complex JS-based column balancing with a simple and robust CSS column layout */}
        <div className="text-left" style={{ columnCount: 2, columnGap: '1rem' }}>
          {categoriesWithExpenses.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>

       <div className="text-center mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
        <p>Generated by Aysha's P&L Dashboard</p>
      </div>
    </div>
  );
};

export default ShareableReport;