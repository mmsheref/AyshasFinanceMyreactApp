
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseProfitChart from './ExpenseProfitChart';
import SalesChart from './SalesChart';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, getTodayDateString, subtractDays } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';
import { SparklesIcon, ChevronRightIcon } from './Icons';

type FilterValue = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';

const Dashboard: React.FC = () => {
  const { sortedRecords: records, activeYear } = useAppContext();
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<FilterValue>('ALL');
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Filter records that actually have sales
  const finishedRecords = useMemo(() => {
    return records.filter(record => record.totalSales > 0);
  }, [records]);

  // Calculations for KPI Cards
  const {
    avg7DayProfit,
    avg30DayProfit,
    totalProfitPeriod
  } = useMemo(() => {
    const todayStr = getTodayDateString();
    const sevenDaysAgoStr = subtractDays(todayStr, 6); 
    const thirtyDaysAgoStr = subtractDays(todayStr, 29);

    let total7Day = 0;
    let count7Day = 0;
    let total30Day = 0;
    let count30Day = 0;
    let totalPeriod = 0;

    finishedRecords.forEach(r => {
        const expenses = calculateTotalExpenses(r);
        const profit = r.totalSales - expenses;
        
        totalPeriod += profit;

        if (r.date >= sevenDaysAgoStr && r.date <= todayStr) {
            total7Day += profit;
            count7Day++;
        }

        if (r.date >= thirtyDaysAgoStr && r.date <= todayStr) {
            total30Day += profit;
            count30Day++;
        }
    });

    return {
      avg7DayProfit: count7Day > 0 ? total7Day / count7Day : 0,
      avg30DayProfit: count30Day > 0 ? total30Day / count30Day : 0,
      totalProfitPeriod: totalPeriod,
    };
  }, [finishedRecords]);
  
  // Filter for Charts
  const filteredRecordsForCharts = useMemo(() => {
      const ascendingRecords = [...finishedRecords].sort((a, b) => a.date.localeCompare(b.date)); 
      
      if (activeFilter === 'ALL') return ascendingRecords;
      
      if (activeFilter === 'CUSTOM') {
          const { startDate, endDate } = dateRange;
          if (!startDate && !endDate) return ascendingRecords;
          return ascendingRecords.filter(record => {
              const afterStartDate = !startDate || record.date >= startDate;
              const beforeEndDate = !endDate || record.date <= endDate;
              return afterStartDate && beforeEndDate;
          });
      }

      const todayStr = getTodayDateString();
      let startStr = '';

      if (activeFilter === '7D') startStr = subtractDays(todayStr, 6);
      if (activeFilter === '30D') startStr = subtractDays(todayStr, 29);
      if (activeFilter === '90D') startStr = subtractDays(todayStr, 89);
      
      return ascendingRecords.filter(record => record.date >= startStr);
  }, [finishedRecords, activeFilter, dateRange]);

  // Chart Data Preparation
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="w-20 h-20 mb-4 flex items-center justify-center bg-primary-container dark:bg-primary-container-dark rounded-full text-primary-on-container dark:text-primary-on-container-dark">
            <SparklesIcon className="w-8 h-8"/>
        </div>
        <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark">Welcome, Aysha!</h2>
        <p className="text-surface-on-variant dark:text-surface-on-variant-dark mt-2 text-sm max-w-xs leading-relaxed">
          {activeYear === 'all' 
            ? "Start tracking your restaurant's performance. Tap the + button to add your first record."
            : `No records found for the fiscal year ${activeYear}. Select another year in settings or add a new record.`}
        </p>
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

  const SummaryCard: React.FC<{ value: number, label: string, subLabel?: string, highlight?: boolean }> = ({ value, label, subLabel, highlight }) => {
      const isPositive = value >= 0;
      return (
        <div className={`p-4 rounded-[20px] flex flex-col justify-between shadow-none transition-colors ${highlight ? 'bg-primary-container dark:bg-primary-container-dark' : 'bg-surface-container dark:bg-surface-dark-container'}`}>
            <div>
                <h3 className={`text-sm font-medium ${highlight ? 'text-primary-on-container dark:text-primary-on-container-dark' : 'text-surface-on-variant dark:text-surface-on-variant-dark'}`}>{label}</h3>
                <p className={`text-2xl font-bold mt-1 tracking-tight ${
                    highlight 
                        ? 'text-primary-on-container dark:text-primary-on-container-dark' 
                        : (isPositive ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark')
                }`}>
                     ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
            </div>
            {subLabel && <p className={`text-xs mt-2 ${highlight ? 'text-primary-on-container/70 dark:text-primary-on-container-dark/70' : 'text-surface-on-variant dark:text-surface-on-variant-dark opacity-80'}`}>{subLabel}</p>}
        </div>
      );
  };
  
  const FilterChip: React.FC<{ label: string, value: FilterValue, active: boolean, onClick: () => void }> = ({ label, value, active, onClick }) => (
      <button
          onClick={onClick}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
              active
                  ? 'bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark border-transparent'
                  : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark border-surface-outline/30 dark:border-surface-outline-dark/30'
          }`}
      >
          {label}
      </button>
  );

  return (
    <div className="space-y-4 pb-6">
        {/* Header */}
        <div>
            <h1 className="text-3xl font-normal text-surface-on dark:text-surface-on-dark">Dashboard</h1>
            <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm">{activeYear === 'all' ? 'Business Overview' : `Fiscal Year ${activeYear}`}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
                <SummaryCard 
                    value={totalProfitPeriod} 
                    label={activeYear === 'all' ? "Total Net Profit" : `Profit for ${activeYear}`} 
                    subLabel={activeYear === 'all' ? `All-time across ${finishedRecords.length} records` : `Across ${finishedRecords.length} records in ${activeYear}`}
                    highlight
                />
            </div>
             <div>
                <SummaryCard 
                    value={avg7DayProfit} 
                    label="7-Day Avg" 
                    subLabel="Daily Profit"
                />
            </div>
            <div>
                <SummaryCard 
                    value={avg30DayProfit} 
                    label="30-Day Avg" 
                    subLabel="Daily Profit"
                />
            </div>
        </div>
        
        {/* Filter Section */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1">
            <FilterChip label="7 Days" value="7D" active={activeFilter === '7D'} onClick={() => handleQuickFilterClick('7D')} />
            <FilterChip label="30 Days" value="30D" active={activeFilter === '30D'} onClick={() => handleQuickFilterClick('30D')} />
            <FilterChip label={activeYear === 'all' ? "All Time" : `Year ${activeYear}`} value="ALL" active={activeFilter === 'ALL'} onClick={() => handleQuickFilterClick('ALL')} />
            <FilterChip label="Custom" value="CUSTOM" active={activeFilter === 'CUSTOM'} onClick={() => handleQuickFilterClick('CUSTOM')} />
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark mb-4 px-1">Daily Performance</h3>
                <ExpenseProfitChart data={chartData} />
            </div>

            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                 <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark mb-4 px-1">Sales Split</h3>
                <SalesChart data={salesChartData} />
            </div>
        </div>

        {/* Recent Activity List */}
        <div className="pt-2">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-base font-medium text-surface-on dark:text-surface-on-dark">Recent Activity</h3>
                <button onClick={() => navigate('/records')} className="text-sm font-medium text-primary dark:text-primary-dark hover:underline">View All</button>
            </div>
            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] overflow-hidden">
                {records.slice(0, 5).map((record, index) => {
                    const totalExpenses = calculateTotalExpenses(record);
                    const profit = (record.totalSales || 0) - totalExpenses;
                    const isLast = index === Math.min(records.length, 5) - 1;
                    return (
                        <div 
                            key={record.id} 
                            onClick={() => navigate(`/records/${record.id}`)}
                            className={`p-4 flex items-center active:bg-surface-variant/20 transition-colors ${!isLast ? 'border-b border-surface-outline/5 dark:border-surface-outline-dark/5' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark flex items-center justify-center mr-4 text-xs font-bold">
                                {new Date(record.date).getDate()}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-medium text-surface-on dark:text-surface-on-dark text-sm truncate">
                                    {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short' })}
                                </p>
                                <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                                    Sales: ₹{record.totalSales.toLocaleString('en-IN')}
                                </p>
                            </div>
                             <div className="text-right flex-shrink-0 ml-2">
                                {record.totalSales === 0 ? (
                                    <span className="text-[10px] font-medium px-2 py-1 bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark rounded-md">Pending</span>
                                ) : (
                                    <p className={`font-medium text-sm ${profit >= 0 ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>
                                        {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-surface-outline dark:text-surface-outline-dark ml-2" />
                        </div>
                    )
                })}
            </div>
        </div>
        
        <DateRangePicker 
            isOpen={isDateRangePickerOpen} 
            onClose={() => setIsDateRangePickerOpen(false)}
            onApply={handleApplyDateRange}
            initialRange={dateRange}
        />
    </div>
  );
};

export default Dashboard;
