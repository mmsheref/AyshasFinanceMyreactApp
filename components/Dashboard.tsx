
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseProfitChart from './ExpenseProfitChart';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, getTodayDateString, formatIndianNumberCompact, getThisMonthRange } from '../utils/record-utils';
import { SparklesIcon, ClockIcon, FireIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon, TagIcon } from './Icons';
import GasManager from './GasManager';

// --- Small Components ---

const StatCard: React.FC<{ 
    label: string, 
    value: string, 
    subValue?: React.ReactNode, 
    icon?: React.ReactNode,
    bgClass?: string,
    textClass?: string
}> = ({ label, value, subValue, icon, bgClass = "bg-surface-container dark:bg-surface-dark-container", textClass = "text-surface-on dark:text-surface-on-dark" }) => (
    <div className={`${bgClass} p-4 rounded-[24px] flex flex-col justify-between h-full shadow-sm border border-surface-outline/5 dark:border-surface-outline-dark/5`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70 truncate pr-2">{label}</span>
            {icon && <div className="opacity-80">{icon}</div>}
        </div>
        <div>
            <div className={`text-2xl font-bold tracking-tight ${textClass}`}>{value}</div>
            {subValue && <div className="mt-1 text-xs">{subValue}</div>}
        </div>
    </div>
);

const EfficiencyCard: React.FC<{
    label: string,
    value: number,
    threshold: number, // e.g., 35 for 35%
}> = ({ label, value, threshold }) => {
    const isGood = value <= threshold;
    const isWarning = value > threshold && value <= threshold + 5;
    
    let statusColor = isGood ? 'bg-success' : (isWarning ? 'bg-yellow-500' : 'bg-error');
    
    return (
        <div className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[24px] border border-surface-outline/5 dark:border-surface-outline-dark/5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark uppercase tracking-wider">{label}</span>
                <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            </div>
            <div className="mt-3">
                <span className="text-2xl font-bold text-surface-on dark:text-surface-on-dark">{value.toFixed(1)}%</span>
                <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5 opacity-70">Target: &lt;{threshold}%</p>
            </div>
        </div>
    );
};

const GasTrackerCard: React.FC = () => {
    const { gasState } = useAppContext();
    const [isManagerOpen, setManagerOpen] = useState(false);
    const { currentStock, emptyCylinders } = gasState;

    return (
        <>
            <div 
                className="bg-surface-container-high dark:bg-surface-dark-container-high p-4 rounded-[24px] active:scale-[0.98] transition-transform cursor-pointer h-full flex flex-col justify-between relative overflow-hidden min-h-[140px]"
                onClick={() => setManagerOpen(true)}
            >
                <div className="absolute -right-4 -top-4 opacity-[0.05] text-surface-on dark:text-surface-on-dark rotate-12 pointer-events-none">
                    <FireIcon className="w-24 h-24" />
                </div>
                
                <div className="flex items-center gap-2 text-tertiary dark:text-tertiary-dark mb-2">
                    <FireIcon className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Gas</span>
                </div>
                
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-surface-on dark:text-surface-on-dark">{currentStock}</span>
                        <span className="text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark">Full</span>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                        <span className="font-bold">{emptyCylinders}</span>&nbsp;Empty
                    </div>
                </div>
            </div>
            {isManagerOpen && <GasManager onClose={() => setManagerOpen(false)} />}
        </>
    );
};

const Dashboard: React.FC = () => {
  const { sortedRecords, allSortedRecords, trackedItems, foodCostCategories } = useAppContext();
  const navigate = useNavigate();

  // 1. Timeframe Logic (This Month)
  const currentMonthDate = new Date();
  const currentMonthStr = currentMonthDate.toLocaleString('default', { month: 'long' });
  const { start: monthStart, end: monthEnd } = getThisMonthRange();

  // 2. Aggregate Data
  const dashboardData = useMemo(() => {
      // Current Month Data
      const currentMonthRecords = sortedRecords.filter(r => r.date >= monthStart && r.date <= monthEnd && !r.isClosed);
      
      const totalSales = currentMonthRecords.reduce((sum, r) => sum + r.totalSales, 0);
      const totalExpenses = currentMonthRecords.reduce((sum, r) => sum + calculateTotalExpenses(r), 0);
      const netProfit = totalSales - totalExpenses;
      
      // Cost Breakdowns
      let foodCost = 0;
      let laborCost = 0;
      
      currentMonthRecords.forEach(r => {
          r.expenses.forEach(cat => {
              const catTotal = cat.items.reduce((s, i) => s + (i.amount || 0), 0);
              if (foodCostCategories.includes(cat.name)) {
                  foodCost += catTotal;
              }
              // Simple heuristic for Labor if not explicitly configured
              if (cat.name.toLowerCase().includes('labour') || cat.name.toLowerCase().includes('labor')) {
                  laborCost += catTotal;
              }
          });
      });

      const foodCostPct = totalSales > 0 ? (foodCost / totalSales) * 100 : 0;
      const laborCostPct = totalSales > 0 ? (laborCost / totalSales) * 100 : 0;

      // Last Month Comparison (Approximation)
      const lastMonthDate = new Date();
      lastMonthDate.setDate(0); // Go to last day of prev month
      const lastMonthStr = lastMonthDate.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      const lastMonthRecords = allSortedRecords.filter(r => r.date.startsWith(lastMonthStr) && !r.isClosed);
      
      const lastMonthAvgProfit = lastMonthRecords.length > 0 
        ? lastMonthRecords.reduce((sum, r) => sum + (r.totalSales - calculateTotalExpenses(r)), 0) / lastMonthRecords.length
        : 0;
        
      const currentMonthAvgProfit = currentMonthRecords.length > 0 
        ? netProfit / currentMonthRecords.length 
        : 0;

      const diffPercent = lastMonthAvgProfit !== 0 
        ? ((currentMonthAvgProfit - lastMonthAvgProfit) / Math.abs(lastMonthAvgProfit)) * 100 
        : 0;

      return {
          totalSales,
          totalExpenses,
          netProfit,
          foodCostPct,
          laborCostPct,
          diffPercent,
          hasData: currentMonthRecords.length > 0,
          recordCount: currentMonthRecords.length
      };
  }, [sortedRecords, allSortedRecords, monthStart, monthEnd, foodCostCategories]);

  // 3. Chart Data (Last 14 Days for trend)
  const chartData = useMemo(() => {
      const data = allSortedRecords.slice(0, 14).reverse();
      return data.map(r => ({
          date: r.date,
          sales: r.totalSales,
          expenses: calculateTotalExpenses(r),
          profit: r.totalSales - calculateTotalExpenses(r)
      }));
  }, [allSortedRecords]);

  // 4. Inventory Alerts
  const inventoryAlerts = useMemo(() => {
      if (trackedItems.length === 0) return [];
      const alerts: { name: string, daysAgo: number }[] = [];
      const today = new Date(getTodayDateString());

      trackedItems.forEach(itemName => {
          const lastRecord = allSortedRecords.find(r => 
              r.expenses.some(cat => cat.items.some(i => i.name === itemName && i.amount > 0))
          );
          if (lastRecord) {
              const lastDate = new Date(lastRecord.date);
              const diffTime = Math.abs(today.getTime() - lastDate.getTime());
              alerts.push({ name: itemName, daysAgo: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) });
          } else {
               alerts.push({ name: itemName, daysAgo: -1 });
          }
      });
      return alerts.sort((a, b) => b.daysAgo - a.daysAgo);
  }, [allSortedRecords, trackedItems]);

  const profitColor = dashboardData.netProfit >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark';
  const profitBg = dashboardData.netProfit >= 0 
    ? 'bg-gradient-to-br from-success-container/50 to-surface-container dark:from-success-container-dark/30 dark:to-surface-dark-container' 
    : 'bg-gradient-to-br from-error-container/50 to-surface-container dark:from-error-container-dark/30 dark:to-surface-dark-container';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <p className="text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark opacity-80 uppercase tracking-wide">
            {currentMonthStr} Overview
          </p>
          <h1 className="text-3xl font-normal text-surface-on dark:text-surface-on-dark tracking-tight">Dashboard</h1>
        </div>
        <button 
            onClick={() => navigate('/records/new')}
            className="w-10 h-10 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-primary-on-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
            <span className="text-2xl leading-none font-light mb-0.5">+</span>
        </button>
      </div>

      {/* Hero Financials */}
      <div className="grid grid-cols-2 gap-3">
          {/* Big Profit Card */}
          <div className={`col-span-2 p-6 rounded-[32px] shadow-sm relative overflow-hidden ${profitBg}`}>
                <div className="relative z-10">
                    <p className="text-sm font-bold uppercase tracking-wider text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Net Profit</p>
                    <h2 className={`text-4xl font-bold tracking-tight mb-2 ${profitColor}`}>
                        {dashboardData.netProfit >= 0 ? '+' : '-'}₹{formatIndianNumberCompact(Math.abs(dashboardData.netProfit))}
                    </h2>
                    {dashboardData.hasData && (
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-white/50 dark:bg-black/20 backdrop-blur-md ${dashboardData.diffPercent >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                                {dashboardData.diffPercent >= 0 ? <ArrowUpIcon className="w-3 h-3 mr-1"/> : <ArrowDownIcon className="w-3 h-3 mr-1"/>}
                                {Math.abs(dashboardData.diffPercent).toFixed(0)}%
                            </span>
                            <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark opacity-70">vs last month avg</span>
                        </div>
                    )}
                </div>
                <div className="absolute right-0 top-0 p-6 opacity-[0.03] text-surface-on dark:text-surface-on-dark transform translate-x-1/4 -translate-y-1/4">
                    <SparklesIcon className="w-40 h-40" />
                </div>
          </div>

          {/* Sales & Expenses */}
          <StatCard 
            label="Sales" 
            value={`₹${formatIndianNumberCompact(dashboardData.totalSales)}`} 
            icon={<ArrowUpIcon className="w-4 h-4 text-success dark:text-success-dark"/>}
          />
          <StatCard 
            label="Expenses" 
            value={`₹${formatIndianNumberCompact(dashboardData.totalExpenses)}`} 
            icon={<ArrowDownIcon className="w-4 h-4 text-error dark:text-error-dark"/>}
          />
      </div>

      {/* Trend Chart (Moved Up and Expanded) */}
      <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] p-5 border border-surface-outline/5 dark:border-surface-outline-dark/5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-secondary-container dark:bg-secondary-container-dark rounded-lg">
                    <ChartBarIcon className="w-4 h-4 text-secondary-on-container dark:text-secondary-on-container-dark" />
                </div>
                <h3 className="text-sm font-bold text-surface-on dark:text-surface-on-dark">Profit Trend</h3>
            </div>
            <span className="text-[10px] bg-surface-container-high dark:bg-surface-dark-container-high px-2 py-1 rounded-full text-surface-on-variant dark:text-surface-on-variant-dark">Last 14 Days</span>
        </div>
        <ExpenseProfitChart data={chartData} />
      </div>

      {/* Efficiency Pulse */}
      <div>
          <h3 className="px-1 text-sm font-bold text-surface-on-variant dark:text-surface-on-variant-dark mb-3 uppercase tracking-wider">Efficiency Pulse</h3>
          <div className="grid grid-cols-2 gap-3">
              <EfficiencyCard label="Food Cost" value={dashboardData.foodCostPct} threshold={35} />
              <EfficiencyCard label="Labor Cost" value={dashboardData.laborCostPct} threshold={30} />
          </div>
      </div>

      {/* Operations Grid (Gas & Inventory) */}
      <div className="grid grid-cols-2 gap-3 pb-6">
        <GasTrackerCard />
        
        {/* Inventory Watch Card */}
        <div 
            className="bg-surface-container-high dark:bg-surface-dark-container-high border border-surface-outline/5 dark:border-surface-outline-dark/5 p-4 rounded-[24px] active:scale-[0.98] transition-transform cursor-pointer h-full flex flex-col min-h-[140px]"
            onClick={() => navigate('/settings')} 
        >
            <div className="flex items-center gap-2 text-secondary dark:text-secondary-dark mb-3">
                <ClockIcon className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Watchlist</h3>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {inventoryAlerts.length > 0 ? (
                    inventoryAlerts.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-surface-on dark:text-surface-on-dark truncate mr-2 text-xs font-medium max-w-[60px]">{item.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.daysAgo > 7 || item.daysAgo === -1
                                ? 'bg-error/20 text-error dark:text-error-light' 
                                : 'bg-surface-container dark:bg-surface-dark-container text-surface-on-variant dark:text-surface-on-variant-dark'
                            }`}>
                                {item.daysAgo === -1 ? 'New' : `${item.daysAgo}d`}
                            </span>
                        </div>
                    ))
                ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                         <TagIcon className="w-6 h-6 mb-1" />
                         <span className="text-[10px]">Add items in Settings</span>
                     </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
