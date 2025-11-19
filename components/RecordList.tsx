import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyRecord } from '../types';
import { SearchIcon, CalendarIcon, XMarkIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';

const RecordCard: React.FC<{record: DailyRecord, onView: (recordId: string) => void}> = React.memo(({ record, onView }) => {
    const totalExpenses = useMemo(() => calculateTotalExpenses(record), [record]);

    const profit = record.totalSales - totalExpenses;
    const profitColor = profit >= 0 ? 'text-success' : 'text-error';

    const profitOrStatus = record.totalSales === 0 ? (
        <>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                In Progress
            </p>
            <p className="text-xs text-slate-400">Enter sales to complete</p>
        </>
    ) : (
        <>
            <p className={`text-xl font-bold ${profitColor}`}>
                {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400">Net Profit</p>
        </>
    );


    return (
        <div 
            onClick={() => onView(record.id)}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    {profitOrStatus}
                </div>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="font-medium">Sales: <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{record.totalSales.toLocaleString('en-IN')}</span></span>
                <span className="font-medium">Expenses: <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{totalExpenses.toLocaleString('en-IN')}</span></span>
            </div>
        </div>
    );
});

const ExpenseSearchResults: React.FC<{ 
  results: { [date: string]: { recordId: string, items: { category: string, name: string, amount: number }[] } };
  searchTerm: string;
}> = ({ results, searchTerm }) => {
    const navigate = useNavigate();
    const resultDates = Object.keys(results).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (resultDates.length === 0) {
        return (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                <p className="text-slate-600 dark:text-slate-400">No expenses found matching "{searchTerm}".</p>
            </div>
        );
    }
    
    const highlightMatch = (text: string, highlight: string) => {
      if (!highlight) return text;
      const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
              <mark key={i} className="bg-primary/20 text-primary font-bold px-0 py-0 rounded bg-opacity-75">{part}</mark>
            ) : (
              part
            )
          )}
        </span>
      );
    };

    return (
        <div className="space-y-3">
            {resultDates.map(date => {
                const { recordId, items } = results[date];
                return (
                    <div key={date} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                            </div>
                            <button onClick={() => navigate(`/records/${recordId}`)} className="text-sm font-semibold text-primary hover:underline flex-shrink-0 ml-2">
                                View Report
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {items.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{highlightMatch(item.name, searchTerm)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                                    </div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">₹{item.amount.toLocaleString('en-IN')}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

const RecordList: React.FC = () => {
  const { sortedRecords: records } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const recordsByDateRange = useMemo(() => {
    return records.filter(record => {
      const recordDate = record.date;
      const afterStartDate = !dateRange.startDate || recordDate >= dateRange.startDate;
      const beforeEndDate = !dateRange.endDate || recordDate <= dateRange.endDate;
      return afterStartDate && beforeEndDate;
    });
  }, [records, dateRange]);

  const expenseSearchResults = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
        return null;
    }

    const results: { [date: string]: { recordId: string, items: { category: string, name: string, amount: number }[] } } = {};
    const searchTermLower = trimmedSearch.toLowerCase();

    recordsByDateRange.forEach(record => {
        const matchingItems: { category: string, name: string, amount: number }[] = [];
        record.expenses.forEach(category => {
            category.items.forEach(item => {
                if (item.name.toLowerCase().includes(searchTermLower) && item.amount > 0) {
                    matchingItems.push({
                        category: category.name,
                        name: item.name,
                        amount: item.amount
                    });
                }
            });
        });

        if (matchingItems.length > 0) {
            results[record.date] = {
                recordId: record.id,
                items: matchingItems
            };
        }
    });
    return results;
  }, [recordsByDateRange, searchTerm]);

  const clearDateFilter = () => setDateRange({ startDate: '', endDate: '' });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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
  const isSearchingExpenses = searchTerm.trim().length > 0;

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">No Records Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tap the '+' button to create your first record.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by expense item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDateModalOpen(true)}
            className="w-full flex items-center text-left px-3 py-2 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm hover:border-primary/50 transition"
          >
            <CalendarIcon className="w-5 h-5 mr-2 text-slate-500 flex-shrink-0" />
            <span className={`flex-grow text-sm truncate ${isDateFilterActive ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-500'}`}>
              {formattedDateRange}
            </span>
          </button>
          {isDateFilterActive && (
            <button
              onClick={clearDateFilter}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
              aria-label="Clear date filter"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isSearchingExpenses ? (
        expenseSearchResults && <ExpenseSearchResults results={expenseSearchResults} searchTerm={searchTerm.trim()} />
      ) : (
        recordsByDateRange.length > 0 ? (
            <div className="space-y-3">
                {recordsByDateRange.map((record) => (
                    <div key={record.id}>
                        <RecordCard record={record} onView={(id) => navigate(`/records/${id}`)} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                <p className="text-slate-600 dark:text-slate-400">No records found for the selected date range.</p>
            </div>
        )
      )}

      <DateRangePicker 
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onApply={setDateRange}
        initialRange={dateRange}
      />
    </div>
  );
};

export default RecordList;