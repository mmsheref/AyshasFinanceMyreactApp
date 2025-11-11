import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { SearchIcon, CalendarIcon, XMarkIcon } from './Icons';
import Modal from './Modal';

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
            className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-xl font-bold ${profitColor}`}>
                        {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-400">Net Profit</p>
                </div>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="font-medium">Sales: <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{record.totalSales.toLocaleString('en-IN')}</span></span>
                <span className="font-medium">Expenses: <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{totalExpenses.toLocaleString('en-IN')}</span></span>
            </div>
        </div>
    );
};

const RecordList: React.FC<RecordListProps> = ({ records, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ startDate: '', endDate: '' });

  const filteredRecords = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();

    return records.filter(record => {
      // Date Range Filter
      const recordDate = record.date;
      const afterStartDate = !dateRange.startDate || recordDate >= dateRange.startDate;
      const beforeEndDate = !dateRange.endDate || recordDate <= dateRange.endDate;
      if (!afterStartDate || !beforeEndDate) {
        return false;
      }
      
      // Search Term Filter
      if (searchTermLower) {
        return (
          new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB').toLowerCase().includes(searchTermLower) ||
          record.date.includes(searchTermLower)
        );
      }
      
      return true;
    });
  }, [records, searchTerm, dateRange]);

  const openDateModal = () => {
    setTempDateRange(dateRange);
    setIsDateModalOpen(true);
  };

  const handleTempDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyDates = () => {
    setDateRange(tempDateRange);
    setIsDateModalOpen(false);
  };

  const clearMainDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
  };
  
  const clearModalDates = () => {
    setTempDateRange({ startDate: '', endDate: '' });
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Add time to treat date as local, preventing timezone issues
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formattedDateRange = useMemo(() => {
    const { startDate, endDate } = dateRange;
    if (!startDate && !endDate) return 'Filter by date';
    if (startDate && !endDate) return `From: ${formatDate(startDate)}`;
    if (!startDate && endDate) return `To: ${formatDate(endDate)}`;
    if (startDate === endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }, [dateRange]);

  const isDateFilterActive = dateRange.startDate || dateRange.endDate;

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">No Records Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tap the '+' button to create your first record.</p>
      </div>
    );
  }

  const inputStyles = "w-full px-3 py-2 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition";
  
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by date (e.g., 24/07/2024)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openDateModal}
            className="w-full flex items-center text-left px-3 py-2 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm hover:border-primary/50 transition"
          >
            <CalendarIcon className="w-5 h-5 mr-2 text-slate-500 flex-shrink-0" />
            <span className={`flex-grow text-sm truncate ${isDateFilterActive ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-500'}`}>
              {formattedDateRange}
            </span>
          </button>
          {isDateFilterActive && (
            <button
              onClick={clearMainDateFilter}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
              aria-label="Clear date filter"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
            {filteredRecords.map(record => (
                <RecordCard key={record.id} record={record} onView={onView} />
            ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            <p className="text-slate-600 dark:text-slate-400">No records found for your search or date range.</p>
        </div>
      )}

      {isDateModalOpen && (
        <Modal onClose={() => setIsDateModalOpen(false)}>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
            <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Filter Records by Date</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input type="date" name="startDate" id="startDate" value={tempDateRange.startDate} onChange={handleTempDateChange} className={inputStyles} max={tempDateRange.endDate || undefined} />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input type="date" name="endDate" id="endDate" value={tempDateRange.endDate} onChange={handleTempDateChange} className={inputStyles} min={tempDateRange.startDate || undefined} />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button onClick={clearModalDates} className="text-sm font-semibold text-primary hover:underline">Clear</button>
              <div className="flex space-x-3">
                 <button type="button" onClick={() => setIsDateModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                 <button type="button" onClick={handleApplyDates} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Apply</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RecordList;