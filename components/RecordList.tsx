
import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { SearchIcon } from './Icons';

interface RecordListProps {
  records: DailyRecord[];
  onView: (record: DailyRecord) => void;
}

const calculateTotalExpenses = (record: DailyRecord) => {
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};

const RecordCard: React.FC<{record: DailyRecord, onView: (record: DailyRecord) => void}> = ({ record, onView }) => {
    const totalExpenses = calculateTotalExpenses(record);
    const profit = record.totalSales - totalExpenses;
    const profitColor = profit >= 0 ? 'text-success' : 'text-error';

    return (
        <div 
            onClick={() => onView(record)}
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-700"
        >
            <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-slate-800 dark:text-slate-100">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className={`text-lg font-bold ${profitColor}`}>
                    {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                </p>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span>Sales: ₹{record.totalSales.toLocaleString('en-IN')}</span>
                <span>Expenses: ₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>
        </div>
    );
};

const RecordList: React.FC<RecordListProps> = ({ records, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const searchTermLower = searchTerm.toLowerCase();
    return records.filter(record => 
        new Date(record.date).toLocaleDateString('en-GB').toLowerCase().includes(searchTermLower) ||
        record.date.includes(searchTermLower)
    );
  }, [records, searchTerm]);

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">No Records Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tap the '+' button to create your first record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by date (e.g., 24/07/2024)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>

      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
            {filteredRecords.map(record => (
                <RecordCard key={record.id} record={record} onView={onView} />
            ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <p className="text-slate-600 dark:text-slate-400">No records found for your search.</p>
        </div>
      )}
    </div>
  );
};

export default RecordList;