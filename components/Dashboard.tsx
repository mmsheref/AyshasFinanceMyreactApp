import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from './Chart';
import SalesChart from './SalesChart';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';

type FilterValue = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';

const Dashboard: React.FC = () => {
  const { sortedRecords: records } = useAppContext();
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<FilterValue>('ALL');
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const finishedRecords = useMemo(() => {
    return records.filter(record => record.totalSales > 0);
  }, [records]);


  const {
    avg7DayProfit,
    avg30DayProfit,
    totalProfitAllTime
  } = useMemo(() => {
    const recordsWithProfit = finishedRecords.map(r => ({
      ...r,
      profit: (r.totalSales || 0) - calculateTotalExpenses(r),
      dateObj: new Date(r.date + 'T00:00:00')
    }));

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recordsLast7Days = recordsWithProfit.filter(r => r.dateObj >= sevenDaysAgo && r.dateObj <= today);
    const recordsLast30Days = recordsWithProfit.filter(r => r.dateObj >= thirtyDaysAgo && r.dateObj <= today);

    const total7DayProfit = recordsLast7Days.reduce((sum, r) => sum + r.profit, 0);
    const total30DayProfit = recordsLast30Days.reduce((sum, r) => sum + r.profit, 0);
    const totalProfitAllTime = recordsWithProfit.reduce((sum, r) => sum + r.profit, 0);

    return {
      avg7DayProfit: recordsLast7Days.length > 0 ? total7DayProfit / recordsLast7Days.length : 0,
      avg30DayProfit: recordsLast30Days.length > 0 ? total30DayProfit / recordsLast30Days.length : 0,
      totalProfitAllTime: totalProfitAllTime,
    };
  }, [finishedRecords]);
  
  const filteredRecordsForCharts = useMemo(() => {
      // records are sorted descending, reverse to get ascending for charts
      const ascendingRecords = [...finishedRecords].reverse(); 
      
      if (activeFilter === 'ALL') {
          return ascendingRecords;
      }
      
      if (activeFilter === 'CUSTOM') {
          const { startDate, endDate } = dateRange;
          if (!startDate && !endDate) return ascendingRecords;
          return ascendingRecords.filter(record => {
              const recordDate = record.date;
              const afterStartDate = !startDate || recordDate >= startDate;
              const beforeEndDate = !endDate || recordDate <= endDate;
              return afterStartDate && beforeEndDate;
          });
      }

      const now = new Date();
      now.setHours(23, 59, 59, 999);

      let daysToFilter = 0;
      if (activeFilter === '7D') daysToFilter = 7;
      if (activeFilter === '30D') daysToFilter = 30;
      if (activeFilter === '90D') daysToFilter = 90;

      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (daysToFilter - 1));
      startDate.setHours(0, 0, 0, 0);

      return ascendingRecords.filter(record => {
          const recordDate = new Date(record.date + 'T00:00:00');
          return recordDate >= startDate && recordDate <= now;
      });
  }, [finishedRecords, activeFilter, dateRange]);

  const chartData = useMemo(() => {
    return filteredRecordsForCharts.map(r => {
        const totalExpenses = calculateTotalExpenses(r);
        const totalSales = r.totalSales || 0;
        return {
            date: r.date,
            sales: totalSales,
            expenses: totalExpenses,
            profit: totalSales - totalExpenses,
        };
    });
  }, [filteredRecordsForCharts]);

  const salesChartData = useMemo(() => {
    return filteredRecordsForCharts.map(r => {
        const morningSales = r.morningSales || 0;
        const totalSales = r.totalSales || 0;
        const nightSales = totalSales - morningSales;
        return {
            date: r.date,
            morningSales,
            nightSales,
            totalSales,
        };
    });
  }, [filteredRecordsForCharts]);


  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Welcome to Aysha's P&L</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tap the '+' button below to create your first record.</p>
      </div>
    );
  }
  
  const handleQuickFilterClick = (value: FilterValue) => {
    setActiveFilter(value);
    if (value === 'CUSTOM') {
        setIsDateRangePickerOpen(true);
    } else {
        setDateRange({ startDate: '', endDate: '' });
    }
  };
  
  const handleApplyDateRange = (newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange);
    setActiveFilter('CUSTOM');
  };

  const getChartTitle = (): string => {
    switch(activeFilter) {
        case '7D': return '(Last 7 Days)';
        case '30D': return '(Last 30 Days)';
        case '90D': return '(Last 90 Days)';
        case 'CUSTOM': 
          if(dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const end = new Date(dateRange.endDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            return `(${start} - ${end})`;
          }
          return '(Custom Range)';
        case 'ALL':
        default: return '(All Time)';
    }
  }

  const getCustomButtonText = () => {
    if(activeFilter === 'CUSTOM' && dateRange.startDate && dateRange.endDate) {
        const start = new Date(dateRange.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const end = new Date(dateRange.endDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return `${start} - ${end}`;
    }
    return 'Custom';
  }

  const ProfitCard: React.FC<{ value: number, label: string, subLabel?: string }> = ({ value, label, subLabel }) => (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-sm h-full">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm truncate">{label}</h3>
        <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${value >= 0 ? 'text-success' : 'text-error'}`}>
             ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        {subLabel && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subLabel}</p>}
    </div>
  );
  
  const filterOptions: { label: string; value: FilterValue }[] = [
    { label: '7D', value: '7D' },
    { label: '30D', value: '30D' },
    { label: '90D', value: '90D' },
    { label: 'All', value: 'ALL' },
  ];

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
             <div>
                <ProfitCard 
                    value={avg7DayProfit} 
                    label="Avg Profit (7D)" 
                />
            </div>
            <div>
                <ProfitCard 
                    value={avg30DayProfit} 
                    label="Avg Profit (30D)" 
                />
            </div>
            <div>
                <ProfitCard 
                    value={totalProfitAllTime} 
                    label="Total Profit" 
                    subLabel={`Across ${finishedRecords.length} records`}
                />
            </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-y-3">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Filter Charts</h3>
                <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleQuickFilterClick(option.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                activeFilter === option.value
                                    ? 'bg-white dark:bg-slate-950 text-primary shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button
                        onClick={() => handleQuickFilterClick('CUSTOM')}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors truncate max-w-[120px] ${
                            activeFilter === 'CUSTOM'
                                ? 'bg-white dark:bg-slate-950 text-primary shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                        }`}
                    >
                        {getCustomButtonText()}
                    </button>
                </div>
            </div>
        </div>

        <DateRangePicker 
            isOpen={isDateRangePickerOpen} 
            onClose={() => setIsDateRangePickerOpen(false)}
            onApply={handleApplyDateRange}
            initialRange={dateRange}
        />

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sales Trend <span className="text-base font-medium text-slate-500 dark:text-slate-400">{getChartTitle()}</span></h3>
          </div>
            <SalesChart data={salesChartData} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Profit/Loss Trend <span className="text-base font-medium text-slate-500 dark:text-slate-400">{getChartTitle()}</span></h3>
          </div>
            <Chart data={chartData} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 p-4 border-b border-slate-100 dark:border-slate-800">Recent Activity</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.slice(0, 5).map((record) => {
                    const totalExpenses = calculateTotalExpenses(record);
                    const profit = (record.totalSales || 0) - totalExpenses;
                    const handleKeyDown = (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            navigate(`/records/${record.id}`);
                        }
                    };
                    return (
                        <li 
                            key={record.id} 
                            onClick={() => navigate(`/records/${record.id}`)}
                            onKeyDown={handleKeyDown}
                            role="button"
                            tabIndex={0}
                            className="p-4 flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-4 flex-shrink-0">
                                <span className="font-bold text-primary text-sm">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric' })}</span>
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            {record.totalSales === 0 ? (
                                <div className="text-right ml-2">
                                    <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">In Progress</span>
                                </div>
                              ) : (
                                <p className={`font-bold text-lg text-right ml-2 ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                                    {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
                                </p>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    </div>
  );
};

export default Dashboard;