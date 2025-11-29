import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyRecord } from '../types';
import { SearchIcon, CalendarIcon, XMarkIcon, ChevronRightIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';

const RecordCard: React.FC<{record: DailyRecord, onView: (recordId: string) => void}> = React.memo(({ record, onView }) => {
    const totalExpenses = useMemo(() => calculateTotalExpenses(record), [record]);

    const profit = record.totalSales - totalExpenses;
    const isProfit = profit >= 0;

    const profitOrStatus = record.totalSales === 0 ? (
        <span className="px-2 py-1 rounded-md bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark text-[10px] font-bold uppercase tracking-wide">Pending</span>
    ) : (
        <span className={`text-base font-bold ${isProfit ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>
            {isProfit ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
        </span>
    );


    return (
        <div 
            onClick={() => onView(record.id)}
            className="bg-surface-container-low dark:bg-surface-dark-container-low p-4 rounded-card active:scale-[0.98] transition-transform duration-200 cursor-pointer border border-surface-outline/10 dark:border-surface-outline-dark/10 shadow-sm"
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-[12px] bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase leading-tight">{new Date(record.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                        <span className="text-sm font-bold leading-tight">{new Date(record.date).getDate()}</span>
                     </div>
                     <div>
                        <p className="font-medium text-base text-surface-on dark:text-surface-on-dark leading-tight">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                        <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5">{new Date(record.date).getFullYear()}</p>
                     </div>
                </div>
                <div className="text-right">
                    {profitOrStatus}
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-surface-outline/5 dark:border-surface-outline-dark/5">
                 <div className="flex flex-col">
                    <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Sales</span>
                    <span className="text-sm font-semibold text-surface-on dark:text-surface-on-dark">₹{record.totalSales.toLocaleString('en-IN')}</span>
                 </div>
                 <div className="h-6 w-px bg-surface-outline/10 dark:bg-surface-outline-dark/10"></div>
                 <div className="flex flex-col text-right">
                    <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Expenses</span>
                    <span className="text-sm font-semibold text-surface-on dark:text-surface-on-dark">₹{totalExpenses.toLocaleString('en-IN')}</span>
                 </div>
            </div>
        </div>
    );
});

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
    if (!trimmedSearch) return null;

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
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const formattedDateRange = useMemo(() => {
    const { startDate, endDate } = dateRange;
    if (!startDate && !endDate) return 'Filter by Date';
    if (startDate && !endDate) return `From ${formatDate(startDate)}`;
    if (!startDate && endDate) return `To ${formatDate(endDate)}`;
    if (startDate === endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }, [dateRange]);

  const isDateFilterActive = dateRange.startDate || dateRange.endDate;
  const isSearchingExpenses = searchTerm.trim().length > 0;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark">No Records Yet</h2>
        <p className="text-surface-on-variant dark:text-surface-on-variant-dark mt-2 max-w-xs text-sm">Tap the + button to add a record.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div>
         <h1 className="text-3xl font-normal text-surface-on dark:text-surface-on-dark">Records</h1>
         <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm">History & Logs</p>
      </div>
        
      {/* Search & Filter Bar */}
      <div className="sticky top-[0px] z-10 space-y-3 bg-surface dark:bg-surface-dark pb-2 pt-2 transition-colors">
        <div className="relative">
          <input
            type="text"
            placeholder="Search expense items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-full border-none text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant dark:placeholder-surface-on-variant-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-on-variant dark:text-surface-on-variant-dark" />
        </div>
        
        <div className="flex gap-2">
             <button
                onClick={() => setIsDateModalOpen(true)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
                    isDateFilterActive 
                    ? 'bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark border-transparent' 
                    : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark border-surface-outline/30 dark:border-surface-outline-dark/30'
                }`}
            >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formattedDateRange}
            </button>
            {isDateFilterActive && (
                 <button onClick={clearDateFilter} className="p-2 rounded-full bg-surface-variant/30 text-surface-on-variant dark:text-surface-on-variant-dark">
                     <XMarkIcon className="w-5 h-5"/>
                 </button>
            )}
        </div>
      </div>

      {isSearchingExpenses ? (
        expenseSearchResults ? (
             Object.keys(expenseSearchResults).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                 <div key={date} className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-card overflow-hidden border border-surface-outline/10 dark:border-surface-outline-dark/10">
                      <div className="p-4 bg-surface-container dark:bg-surface-dark-container border-b border-surface-outline/5 dark:border-surface-outline-dark/5 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/records/${expenseSearchResults[date].recordId}`)}>
                           <span className="font-medium text-surface-on dark:text-surface-on-dark">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           <ChevronRightIcon className="w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark" />
                      </div>
                      <div className="divide-y divide-surface-outline/5 dark:divide-surface-outline-dark/5">
                          {expenseSearchResults[date].items.map((item, idx) => (
                              <div key={idx} className="p-3 flex justify-between text-sm">
                                  <span className="text-surface-on dark:text-surface-on-dark">{item.name} <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark ml-1 opacity-70">({item.category})</span></span>
                                  <span className="font-mono text-surface-on dark:text-surface-on-dark">₹{item.amount}</span>
                              </div>
                          ))}
                      </div>
                 </div>
             ))
        ) : (
             <div className="text-center py-10 text-surface-on-variant dark:text-surface-on-variant-dark">No matches found.</div>
        )
      ) : (
        recordsByDateRange.length > 0 ? (
            <div className="space-y-3 pb-24">
                {recordsByDateRange.map((record) => (
                    <RecordCard key={record.id} record={record} onView={(id) => navigate(`/records/${id}`)} />
                ))}
            </div>
        ) : (
            <div className="text-center py-10 text-surface-on-variant dark:text-surface-on-variant-dark">
                No records found in this date range.
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