
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseProfitChart from './ExpenseProfitChart';
import SalesChart from './SalesChart';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, getTodayDateString, subtractDays, getThisWeekRange, getThisMonthRange, formatIndianNumberCompact } from '../utils/record-utils';
import { SparklesIcon, PlusIcon, CalendarIcon, ChartBarIcon, ClockIcon, FireIcon, ListIcon } from './Icons';
import Modal from './Modal';
import GasManager from './GasManager'; // Switched from legacy GasTrackerCard/Modal

type ChartFilter = 'WEEK' | 'MONTH' | 'YEAR';

const FilterPill: React.FC<{ label: string, value: ChartFilter, active: boolean, onClick: (val: ChartFilter) => void }> = ({ label, value, active, onClick }) => (
    <button 
      onClick={() => onClick(value)}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${active ? 'bg-primary dark:bg-primary-dark text-white dark:text-primary-on-dark' : 'bg-surface-container-highest dark:bg-surface-dark-container-highest text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface-outline/20'}`}
    >
        {label}
    </button>
);

// Updated Gas Card for Dashboard
const GasTrackerCard: React.FC = () => {
    const { gasState } = useAppContext();
    const [isManagerOpen, setManagerOpen] = useState(false);

    // Calculated derived state is now available directly from Context
    const { currentStock, emptyCylinders, avgDailyUsage, daysSinceLastSwap } = gasState;

    return (
        <>
            <div 
                className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[20px] active:scale-[0.99] transition-transform cursor-pointer col-span-2 sm:col-span-1"
                onClick={() => setManagerOpen(true)}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <FireIcon className="w-5 h-5 text-tertiary dark:text-tertiary-dark" />
                        <h3 className="text-sm font-bold text-surface-on dark:text-surface-on-dark">Gas Inventory</h3>
                    </div>
                </div>
                
                <div className="flex gap-2">
                     <div className={`flex-1 p-2 rounded-xl flex flex-col items-center justify-center ${currentStock <= 1 ? 'bg-error-container dark:bg-error-container-dark text-error-on-container dark:text-error-on-container-dark' : 'bg-surface-container-high dark:bg-surface-dark-container-high'}`}>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Full</span>
                        <span className="text-xl font-bold">{currentStock}</span>
                     </div>
                     <div className="flex-1 p-2 rounded-xl bg-surface-container-high dark:bg-surface-dark-container-high flex flex-col items-center justify-center text-surface-on dark:text-surface-on-dark">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Empty</span>
                        <span className="text-xl font-bold">{emptyCylinders}</span>
                     </div>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div>
                         <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark mb-0.5">Usage</p>
                         <p className="text-sm font-bold text-surface-on dark:text-surface-on-dark">
                             {avgDailyUsage > 0 ? `${avgDailyUsage.toFixed(1)}` : '-'} <span className="text-[10px] font-normal opacity-70">Cyl/Day</span>
                         </p>
                    </div>
                     <div className="text-right">
                         <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark">Last Change</p>
                         <p className="text-xs font-medium text-surface-on dark:text-surface-on-dark">{daysSinceLastSwap >= 0 ? `${daysSinceLastSwap} days ago` : 'Never'}</p>
                    </div>
                </div>
            </div>

            {isManagerOpen && (
                <GasManager onClose={() => setManagerOpen(false)} />
            )}
        </>
    );
};

const Dashboard: React.FC = () => {
  const { sortedRecords: records, allSortedRecords, activeYear, trackedItems } = useAppContext();
  const navigate = useNavigate();
  const [chartFilter, setChartFilter] = useState<ChartFilter>('WEEK');

  // 1. Get Dates
  const todayStr = getTodayDateString();

  // 2. Prepare Pulse Data (Latest COMPLETED Record - i.e. Yesterday or older)
  const pulseStats = useMemo(() => {
    // Find the latest record that is strictly before today
    const displayRecord = records.find(r => r.date < todayStr);
    
    if (!displayRecord) return null;

    const expenses = calculateTotalExpenses(displayRecord);
    const isYesterday = displayRecord.date === subtractDays(todayStr, 1);

    let label = '';
    if (isYesterday) {
        label = 'Yesterday';
    } else {
        // Show weekday name for older records
        label = new Date(displayRecord.date).toLocaleDateString('en-GB', { weekday: 'long' });
    }

    const profit = displayRecord.totalSales - expenses;
    
    return {
        label,
        dateDisplay: new Date(displayRecord.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        sales: displayRecord.totalSales,
        expenses,
        profit,
        recordId: displayRecord.id,
        isClosed: displayRecord.isClosed
    };
  }, [records, todayStr]);

  // 3. Prepare Chart Data based on Filter
  const chartData = useMemo(() => {
    let data = [];
    
    if (chartFilter === 'WEEK') {
        data = allSortedRecords.slice(0, 7);
    } else if (chartFilter === 'MONTH') {
        data = allSortedRecords.slice(0, 30);
    } else {
        // Year view / 90 Days
        data = allSortedRecords.slice(0, 90);
    }

    return data.reverse().map(r => ({
        date: r.date,
        sales: r.totalSales,
        expenses: calculateTotalExpenses(r),
        profit: r.totalSales - calculateTotalExpenses(r)
    }));
  }, [allSortedRecords, chartFilter]);

  // 4. Inventory Watch Data
  const inventoryAlerts = useMemo(() => {
      if (trackedItems.length === 0) return [];
      
      const alerts: { name: string, daysAgo: number, date: string }[] = [];
      const today = new Date(todayStr);

      trackedItems.forEach(itemName => {
          // Find last purchase
          const lastRecord = allSortedRecords.find(r => 
              r.expenses.some(cat => cat.items.some(i => i.name === itemName && i.amount > 0))
          );

          if (lastRecord) {
              const lastDate = new Date(lastRecord.date);
              const diffTime = Math.abs(today.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              alerts.push({ name: itemName, daysAgo: diffDays, date: lastRecord.date });
          } else {
               alerts.push({ name: itemName, daysAgo: -1, date: '' });
          }
      });
      
      return alerts.sort((a, b) => b.daysAgo - a.daysAgo);
  }, [allSortedRecords, trackedItems, todayStr]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-normal text-surface-on dark:text-surface-on-dark">Dashboard</h1>
          <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm">Overview & Insights</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => navigate('/records')}
                className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-surface-dark-container-high flex items-center justify-center text-surface-on dark:text-surface-on-dark"
                aria-label="View All Records"
            >
                <ListIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => navigate('/settings')}
                className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-surface-dark-container-high flex items-center justify-center text-surface-on dark:text-surface-on-dark"
                aria-label="Settings"
            >
                <ClockIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Pulse Card & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pulse Card - Shows Yesterday/Last Record */}
        <div 
            onClick={() => pulseStats && navigate(`/records/${pulseStats.recordId}`)}
            className={`relative overflow-hidden rounded-[24px] p-5 shadow-sm active:scale-[0.99] transition-all cursor-pointer ${
                !pulseStats 
                ? 'bg-surface-container dark:bg-surface-dark-container' 
                : pulseStats.profit >= 0 
                    ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' 
                    : 'bg-error-container dark:bg-error-container-dark text-error-on-container dark:text-error-on-container-dark'
            }`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <SparklesIcon className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                        {pulseStats ? pulseStats.label : 'No Data'}
                    </span>
                    {pulseStats && (
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                            {pulseStats.dateDisplay}
                        </span>
                    )}
                </div>

                {pulseStats ? (
                    pulseStats.isClosed ? (
                         <div className="py-4">
                            <span className="text-3xl font-bold opacity-90">Shop Closed</span>
                            <p className="text-sm mt-1 opacity-70">Fixed expenses only</p>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold tracking-tight">
                                    {pulseStats.profit >= 0 ? '+' : '-'}₹{formatIndianNumberCompact(Math.abs(pulseStats.profit))}
                                </span>
                            </div>
                            <p className="text-sm font-medium mt-1 opacity-80">Net Profit</p>
                            
                            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex gap-6">
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-60 mb-0.5">Sales</p>
                                    <p className="text-lg font-bold">₹{formatIndianNumberCompact(pulseStats.sales)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-60 mb-0.5">Exp</p>
                                    <p className="text-lg font-bold">₹{formatIndianNumberCompact(pulseStats.expenses)}</p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="py-6 text-center opacity-60">
                        <p>No past records found.</p>
                        <p className="text-xs mt-1">Add a record to see stats here.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Gas & Inventory */}
        <div className="grid grid-cols-2 gap-4">
            <GasTrackerCard />
            
            {/* Inventory Watch Card */}
            <div 
                className="bg-secondary-container dark:bg-secondary-container-dark p-4 rounded-[20px] col-span-2 sm:col-span-1"
                onClick={() => navigate('/settings')} // Navigate to settings to manage items
            >
                <div className="flex items-center gap-2 mb-3 text-secondary-on-container dark:text-secondary-on-container-dark">
                    <ClockIcon className="w-5 h-5" />
                    <h3 className="text-sm font-bold">Inventory Watch</h3>
                </div>
                
                <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                    {inventoryAlerts.length > 0 ? (
                        inventoryAlerts.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-secondary-on-container dark:text-secondary-on-container-dark truncate mr-2">{item.name}</span>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                    item.daysAgo > 7 
                                    ? 'bg-error/20 text-error-on-container dark:text-error-light' 
                                    : 'bg-surface/20 text-secondary-on-container dark:text-secondary-on-container-dark'
                                }`}>
                                    {item.daysAgo === -1 ? 'New' : `${item.daysAgo}d`}
                                </span>
                            </div>
                        ))
                    ) : (
                         <div className="text-xs text-secondary-on-container/60 dark:text-secondary-on-container-dark/60 text-center py-2">
                             Tap to select items to track last purchase.
                         </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-surface-on dark:text-surface-on-dark">Trends</h3>
            <div className="flex gap-2">
                <FilterPill label="7D" value="WEEK" active={chartFilter === 'WEEK'} onClick={setChartFilter} />
                <FilterPill label="30D" value="MONTH" active={chartFilter === 'MONTH'} onClick={setChartFilter} />
                <FilterPill label="90D" value="YEAR" active={chartFilter === 'YEAR'} onClick={setChartFilter} />
            </div>
        </div>
        
        <div className="bg-surface-container-low dark:bg-surface-dark-container-low p-4 rounded-[24px] border border-surface-outline/5 dark:border-surface-outline-dark/5">
            <h4 className="text-xs font-bold uppercase text-surface-on-variant dark:text-surface-on-variant-dark mb-4 tracking-wider">Profit & Loss Flow</h4>
            <ExpenseProfitChart data={chartData} />
        </div>
      </div>
      
      {/* Add New FAB Placeholder (Visual balance for the fixed FAB) */}
      <div className="h-16"></div>
    </div>
  );
};

export default Dashboard;
