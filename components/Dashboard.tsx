
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseProfitChart from './ExpenseProfitChart';
import SalesChart from './SalesChart';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, getTodayDateString, subtractDays, getThisWeekRange, getThisMonthRange, formatIndianNumberCompact } from '../utils/record-utils';
import { SparklesIcon, PlusIcon, CalendarIcon, ChartBarIcon, ClockIcon } from './Icons';

type ChartFilter = 'WEEK' | 'MONTH' | 'YEAR';

const FilterPill: React.FC<{ label: string, value: ChartFilter, active: boolean, onClick: (val: ChartFilter) => void }> = ({ label, value, active, onClick }) => (
    <button 
      onClick={() => onClick(value)}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${active ? 'bg-primary dark:bg-primary-dark text-white dark:text-primary-on-dark' : 'bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface-outline/20'}`}
    >
        {label}
    </button>
);

const Dashboard: React.FC = () => {
  const { sortedRecords: records, allSortedRecords, activeYear, trackedItems } = useAppContext();
  const navigate = useNavigate();
  const [chartFilter, setChartFilter] = useState<ChartFilter>('WEEK');

  // 1. Get Dates
  const todayStr = getTodayDateString();

  // 2. Prepare Pulse Data (Most Recent Record)
  const pulseStats = useMemo(() => {
    // Always fall back to the most recent record available
    const displayRecord = records[0];
    
    if (!displayRecord) return null;

    const expenses = calculateTotalExpenses(displayRecord);
    const isToday = displayRecord.date === todayStr;
    const isYesterday = displayRecord.date === subtractDays(todayStr, 1);

    let label = '';
    if (isToday) {
        label = 'Today (Live)';
    } else if (isYesterday) {
        label = 'Yesterday';
    } else {
        // Show weekday name for older records
        label = new Date(displayRecord.date).toLocaleDateString('en-GB', { weekday: 'long' });
    }

    return {
        id: displayRecord.id, // Needed for navigation
        date: displayRecord.date,
        label,
        isToday,
        sales: displayRecord.totalSales,
        expenses: expenses,
        profit: displayRecord.totalSales - expenses,
        isClosed: displayRecord.isClosed
    };
  }, [records, todayStr]);

  // 3. Calculate "This Week's" Stats (Monday -> Today)
  const thisWeekStats = useMemo(() => {
    const { start: startOfWeek } = getThisWeekRange();
    
    let totalSales = 0;
    let totalExpenses = 0;
    let recordCount = 0;
    let openDaysCount = 0;
    let earliestDate = todayStr;
    let latestDate = startOfWeek;

    records.forEach(r => {
        if (r.date >= startOfWeek && r.date <= todayStr) {
            // Don't track in-progress record for weekly net profit
            // In-progress = Not Closed AND Total Sales is 0
            if (!r.isClosed && r.totalSales === 0) {
                return;
            }

            totalSales += r.totalSales;
            totalExpenses += calculateTotalExpenses(r);
            recordCount++;
            
            if (!r.isClosed) {
                openDaysCount++;
            }

            if (r.date < earliestDate) earliestDate = r.date;
            if (r.date > latestDate) latestDate = r.date;
        }
    });

    const profit = totalSales - totalExpenses;
    
    // Avoid division by zero
    const avgSales = openDaysCount > 0 ? totalSales / openDaysCount : 0;
    const avgExpenses = openDaysCount > 0 ? totalExpenses / openDaysCount : 0;
    const avgProfit = openDaysCount > 0 ? profit / openDaysCount : 0;
    
    // Format range text
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const rangeText = recordCount > 0 
        ? `${formatDate(earliestDate)} - ${formatDate(latestDate)}` 
        : 'No records';

    return {
        profit,
        sales: totalSales,
        expenses: totalExpenses,
        avgProfit,
        avgSales,
        avgExpenses,
        count: recordCount,
        openDaysCount,
        startDate: startOfWeek,
        rangeText
    };
  }, [records, todayStr]);

  // 4. Chart Data (Dynamic based on filter)
  const chartData = useMemo(() => {
    const validRecords = records.filter(r => r.isClosed || r.totalSales > 0);
    let filteredRecords = validRecords;
    
    if (chartFilter === 'WEEK') {
        const { start } = getThisWeekRange();
        filteredRecords = validRecords.filter(r => r.date >= start);
    } else if (chartFilter === 'MONTH') {
        const { start } = getThisMonthRange();
        filteredRecords = validRecords.filter(r => r.date >= start);
    } 
    
    return [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date)).map(r => {
        const totalExpenses = calculateTotalExpenses(r);
        return {
            date: r.date,
            sales: r.totalSales,
            expenses: totalExpenses,
            profit: r.isClosed ? -totalExpenses : r.totalSales - totalExpenses,
        };
    });
  }, [records, chartFilter]);

  const salesChartData = useMemo(() => {
    const validRecords = records.filter(r => r.isClosed || r.totalSales > 0);
    let filteredRecords = validRecords;

    if (chartFilter === 'WEEK') {
        const { start } = getThisWeekRange();
        filteredRecords = validRecords.filter(r => r.date >= start);
    } else if (chartFilter === 'MONTH') {
        const { start } = getThisMonthRange();
        filteredRecords = validRecords.filter(r => r.date >= start);
    }

    return [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date)).map(r => {
        return {
            date: r.date,
            morningSales: r.morningSales || 0,
            nightSales: (r.totalSales || 0) - (r.morningSales || 0),
            totalSales: r.totalSales || 0,
        };
    });
  }, [records, chartFilter]);

  // 5. Tracked Items Data
  const trackedItemsData = useMemo(() => {
    if (!trackedItems || trackedItems.length === 0) return [];
    
    return trackedItems.map(itemName => {
        const latestRecord = allSortedRecords.find(record => {
            return record.expenses.some(cat => 
                cat.items.some(item => item.name === itemName && item.amount > 0)
            );
        });

        if (!latestRecord) return { name: itemName, daysAgo: null, date: null, amount: 0 };

        const purchaseDate = new Date(latestRecord.date + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        let amount = 0;
        latestRecord.expenses.forEach(cat => {
            const item = cat.items.find(i => i.name === itemName);
            if (item) amount = item.amount;
        });

        return {
            name: itemName,
            daysAgo,
            date: latestRecord.date,
            amount
        };
    }).sort((a, b) => {
        if (a.daysAgo === null && b.daysAgo === null) return 0;
        if (a.daysAgo === null) return 1;
        if (b.daysAgo === null) return -1;
        return a.daysAgo - b.daysAgo;
    });

  }, [trackedItems, allSortedRecords, todayStr]);


  // --- EMPTY STATE ---
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="w-20 h-20 mb-4 flex items-center justify-center bg-primary-container dark:bg-primary-container-dark rounded-full text-primary-on-container dark:text-primary-on-container-dark">
            <SparklesIcon className="w-8 h-8"/>
        </div>
        <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark">Welcome, Aysha!</h2>
        <p className="text-surface-on-variant dark:text-surface-on-variant-dark mt-2 text-sm max-w-xs leading-relaxed">
           Ready to calculate your profit? Add your first record to get started.
        </p>
        <button 
            onClick={() => navigate('/records/new')}
            className="mt-6 flex items-center px-6 py-3 bg-primary dark:bg-primary-dark text-white rounded-full font-bold shadow-lg"
        >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Today's Record
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 pt-2">
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-normal text-surface-on dark:text-surface-on-dark">Overview</h1>
                <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm">
                    {activeYear === 'all' ? 'Business Dashboard' : `Fiscal Year ${activeYear}`}
                </p>
            </div>
        </div>

        {/* SECTION 0: INVENTORY WATCH */}
        {trackedItemsData.length > 0 && (
            <div>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <ClockIcon className="w-5 h-5 text-surface-on-variant dark:text-surface-on-variant-dark"/>
                    <h3 className="text-base font-medium text-surface-on dark:text-surface-on-dark">Inventory Watch</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {trackedItemsData.map((item) => (
                        <div key={item.name} className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[20px] flex flex-col justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-surface-on-variant dark:text-surface-on-variant-dark truncate mb-2">{item.name}</p>
                            {item.daysAgo !== null ? (
                                <div>
                                    <p className="text-xl font-bold text-surface-on dark:text-surface-on-dark leading-none mb-1">
                                        {item.daysAgo === 0 ? 'Today' : (item.daysAgo === 1 ? 'Yesterday' : `${item.daysAgo} Days`)}
                                    </p>
                                    <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark">
                                        {new Date(item.date!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • ₹{item.amount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-surface-on-variant/50 dark:text-surface-on-variant-dark/50 italic">Not purchased yet</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SECTION 1: PULSE (LATEST RECORD) */}
        {pulseStats && (
            <div 
                className="bg-surface-container-high dark:bg-surface-dark-container-high rounded-[24px] p-4 shadow-sm border border-surface-outline/10 dark:border-surface-outline-dark/10 active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => navigate(`/records/${pulseStats.id}`)}
            >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${pulseStats.isToday ? 'bg-primary/10 dark:bg-primary-dark/10' : 'bg-surface-variant/20'}`}>
                            {pulseStats.isToday ? (
                                <SparklesIcon className={`w-4 h-4 ${pulseStats.isToday ? 'text-primary dark:text-primary-dark' : 'text-surface-on-variant'}`}/>
                            ) : (
                                <CalendarIcon className="w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark"/>
                            )}
                        </div>
                        <h2 className="text-sm font-bold text-surface-on dark:text-surface-on-dark">
                            {pulseStats.label}
                        </h2>
                    </div>
                    <span className="text-[10px] font-medium text-surface-on-variant dark:text-surface-on-variant-dark bg-surface-container-highest dark:bg-surface-dark-container-highest px-2 py-0.5 rounded-md">
                        {new Date(pulseStats.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
                
                {pulseStats.isClosed ? (
                    <div className="py-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on-variant dark:text-surface-on-variant-dark text-xs font-bold uppercase tracking-wider rounded-lg border border-surface-outline/20">Shop Closed</span>
                        <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark mt-1">Fixed Expenses: ₹{pulseStats.expenses.toLocaleString('en-IN')}</p>
                    </div>
                ) : (
                    <>
                        {/* Big Profit Number */}
                        <div className="mt-1 mb-2">
                            <span className={`text-3xl font-bold tracking-tight ${pulseStats.profit >= 0 ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>
                                {pulseStats.profit >= 0 ? '+' : ''}₹{Math.abs(pulseStats.profit).toLocaleString('en-IN')}
                            </span>
                            <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5">
                                {pulseStats.profit < 0 ? "Loss (Expenses > Sales)" : "Net Profit"}
                            </p>
                        </div>

                        {/* Mini Breakdown */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-outline/10 dark:border-surface-outline-dark/10">
                            <div>
                                <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark">Sales</p>
                                <p className="text-sm font-semibold text-surface-on dark:text-surface-on-dark">₹{pulseStats.sales.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark">Expenses</p>
                                <p className="text-sm font-semibold text-error dark:text-error-dark">₹{pulseStats.expenses.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}

        {/* SECTION 2: THIS WEEK'S PERFORMANCE */}
        <div>
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-surface-on-variant dark:text-surface-on-variant-dark"/>
                    <h3 className="text-base font-medium text-surface-on dark:text-surface-on-dark">This Week (Mon - Sun)</h3>
                </div>
            </div>
            
            <div className="space-y-3">
                {/* 1. Profit Card */}
                <div className="bg-surface-container dark:bg-surface-dark-container p-5 rounded-[24px]">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-surface-on-variant dark:text-surface-on-variant-dark">Weekly Net Profit</span>
                        <span className="text-[10px] bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark px-2 py-0.5 rounded-full font-bold">
                            {thisWeekStats.count} Days Rec.
                        </span>
                    </div>
                    {thisWeekStats.rangeText !== 'No records' && (
                        <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark mb-2 opacity-80">
                            {thisWeekStats.rangeText}
                        </p>
                    )}
                    
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${thisWeekStats.profit >= 0 ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>
                            {thisWeekStats.profit >= 0 ? '+' : ''}₹{thisWeekStats.profit.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-surface-outline/10 dark:border-surface-outline-dark/10 flex justify-between items-center">
                        <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">Daily Average</span>
                        <span className="text-sm font-semibold text-surface-on dark:text-surface-on-dark">
                             ~ ₹{Math.round(thisWeekStats.avgProfit).toLocaleString('en-IN')} / day
                        </span>
                    </div>
                </div>

                {/* 2. Sales & Expenses Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Sales */}
                    <div className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[20px]">
                        <p className="text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Total Sales</p>
                        <p className="text-xl font-bold text-surface-on dark:text-surface-on-dark">
                            ₹{formatIndianNumberCompact(thisWeekStats.sales)}
                        </p>
                        <div className="mt-2 text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark opacity-80">
                            Avg: ₹{Math.round(thisWeekStats.avgSales).toLocaleString('en-IN')}/day
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[20px]">
                        <p className="text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Total Expenses</p>
                        <p className="text-xl font-bold text-error dark:text-error-dark">
                            ₹{formatIndianNumberCompact(thisWeekStats.expenses)}
                        </p>
                        <div className="mt-2 text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark opacity-80">
                            Avg: ₹{Math.round(thisWeekStats.avgExpenses).toLocaleString('en-IN')}/day
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-4 pt-2">
             <div className="flex items-center justify-between px-1">
                 <h3 className="text-base font-medium text-surface-on dark:text-surface-on-dark">Trends</h3>
                 <div className="flex gap-2">
                     <FilterPill label="Week" value="WEEK" active={chartFilter === 'WEEK'} onClick={setChartFilter} />
                     <FilterPill label="Month" value="MONTH" active={chartFilter === 'MONTH'} onClick={setChartFilter} />
                     <FilterPill label="Year" value="YEAR" active={chartFilter === 'YEAR'} onClick={setChartFilter} />
                 </div>
             </div>

            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                <div className="flex justify-between items-center mb-4 px-1">
                     <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark">Profit Trend</h3>
                </div>
                <ExpenseProfitChart data={chartData} />
            </div>

            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                 <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark mb-4 px-1">Sales Split</h3>
                <SalesChart data={salesChartData} />
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
