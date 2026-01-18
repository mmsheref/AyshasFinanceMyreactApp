
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyRecord } from '../types';
import { SearchIcon, CalendarIcon, XMarkIcon, ChevronRightIcon, ListIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';

const RecordCard: React.FC<{record: DailyRecord, onView: (recordId: string) => void}> = React.memo(({ record, onView }) => {
    const totalExpenses = useMemo(() => calculateTotalExpenses(record), [record]);
    const profit = record.totalSales - totalExpenses;
    const isProfit = profit >= 0;

    return (
        <div 
            onClick={() => onView(record.id)}
            className="group bg-surface-container dark:bg-surface-dark-container p-4 rounded-[24px] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-transparent hover:border-surface-outline/10 dark:hover:border-surface-outline-dark/10 shadow-sm"
        >
            <div className="flex items-stretch gap-4">
                {/* Date Block */}
                <div className="flex-shrink-0 w-16 bg-surface-container-high dark:bg-surface-dark-container-high rounded-2xl flex flex-col items-center justify-center py-2 text-surface-on dark:text-surface-on-dark">
                    <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">
                        {new Date(record.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold leading-none my-0.5">
                        {new Date(record.date).getDate()}
                    </span>
                    <span className="text-[10px] font-medium opacity-60">
                        {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                    </span>
                </div>

                {/* Financials Info */}
                <div className="flex-grow flex flex-col justify-center">
                    {record.isClosed ? (
                        <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on-variant dark:text-surface-on-variant-dark text-[10px] font-bold uppercase tracking-wide">
                                Shop Closed
                            </span>
                            <div className="mt-2 text-xs text-surface-on-variant dark:text-surface-on-variant-dark flex justify-between">
                                <span>Fixed Exp:</span>
                                <span className="font-mono">₹{totalExpenses.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Net Profit</span>
                                <span className={`text-lg font-bold tracking-tight ${isProfit ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                                    {isProfit ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                                </span>
                            </div>
                            
                            <div className="h-px w-full bg-surface-outline/10 dark:bg-surface-outline-dark/10 mb-2"></div>

                            <div className="flex justify-between text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 dark:bg-primary-dark/50"></span>
                                    <span>Sales: <span className="font-medium text-surface-on dark:text-surface-on-dark">₹{record.totalSales.toLocaleString('en-IN')}</span></span>
                                </div>
                                <div>
                                    <span>Exp: <span className="font-medium text-surface-on dark:text-surface-on-dark">₹{totalExpenses.toLocaleString('en-IN')}</span></span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Chevron */}
                <div className="flex items-center justify-center text-surface-outline/50 dark:text-surface-outline-dark/50 group-active:translate-x-1 transition-transform">
                    <ChevronRightIcon className="w-5 h-5" />
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-surface-container-high dark:bg-surface-dark-container-high rounded-full flex items-center justify-center mb-4">
            <ListIcon className="w-8 h-8 text-surface-on-variant dark:text-surface-on-variant-dark opacity-50" />
        </div>
        <h2 className="text-xl font-bold text-surface-on dark:text-surface-on-dark">No Records Yet</h2>
        <p className="text-surface-on-variant dark:text-surface-on-variant-dark mt-2 text-sm">Tap the + button to start tracking your daily finances.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header - now handled by Layout but we keep search here */}
        
      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-20 space-y-3 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-sm pb-2 pt-2 transition-colors -mx-4 px-4 border-b border-surface-outline/5 dark:border-surface-outline-dark/5">
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl border-none text-sm text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant dark:placeholder-surface-on-variant-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark" />
            </div>
            
            <button
                onClick={() => setIsDateModalOpen(true)}
                className={`flex-shrink-0 flex items-center px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isDateFilterActive 
                    ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark border-transparent' 
                    : 'bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on-variant dark:text-surface-on-variant-dark border-transparent'
                }`}
            >
                <CalendarIcon className="w-4 h-4" />
                {isDateFilterActive && <span className="ml-2">{formattedDateRange}</span>}
            </button>
            {isDateFilterActive && (
                 <button onClick={clearDateFilter} className="flex-shrink-0 w-10 flex items-center justify-center rounded-xl bg-surface-variant/30 text-surface-on-variant dark:text-surface-on-variant-dark">
                     <XMarkIcon className="w-5 h-5"/>
                 </button>
            )}
        </div>
      </div>

      {isSearchingExpenses ? (
        expenseSearchResults ? (
             Object.keys(expenseSearchResults).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                 <div key={date} className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] overflow-hidden border border-surface-outline/10 dark:border-surface-outline-dark/10">
                      <div className="p-3 bg-surface-container dark:bg-surface-dark-container border-b border-surface-outline/5 dark:border-surface-outline-dark/5 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/records/${expenseSearchResults[date].recordId}`)}>
                           <span className="font-bold text-sm text-surface-on dark:text-surface-on-dark">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           <ChevronRightIcon className="w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark" />
                      </div>
                      <div className="divide-y divide-surface-outline/5 dark:divide-surface-outline-dark/5">
                          {expenseSearchResults[date].items.map((item, idx) => (
                              <div key={idx} className="p-3 flex justify-between text-sm">
                                  <span className="text-surface-on dark:text-surface-on-dark font-medium">{item.name} <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark ml-1 font-normal opacity-70">({item.category})</span></span>
                                  <span className="font-mono text-surface-on dark:text-surface-on-dark">₹{item.amount}</span>
                              </div>
                          ))}
                      </div>
                 </div>
             ))
        ) : (
             <div className="text-center py-10 text-surface-on-variant dark:text-surface-on-variant-dark text-sm">No matches found.</div>
        )
      ) : (
        recordsByDateRange.length > 0 ? (
            <div className="space-y-3 pb-6">
                {recordsByDateRange.map((record) => (
                    <RecordCard key={record.id} record={record} onView={(id) => navigate(`/records/${id}`)} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-surface-on-variant dark:text-surface-on-variant-dark">
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
