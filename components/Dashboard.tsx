import React, { useMemo } from 'react';
import { DailyRecord } from '../types';
import Chart from './Chart';

interface DashboardProps {
  records: DailyRecord[];
  onViewRecord: (record: DailyRecord) => void;
}

const calculateTotalExpenses = (record: DailyRecord) => {
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};

const Dashboard: React.FC<DashboardProps> = ({ records, onViewRecord }) => {

  const {
    avg7DayProfit,
    avg30DayProfit,
    totalProfitAllTime
  } = useMemo(() => {
    const recordsWithProfit = records.map(r => ({
      ...r,
      profit: (r.totalSales || 0) - calculateTotalExpenses(r),
      dateObj: new Date(r.date)
    }));

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 days before today = 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the 7th day ago

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 29 days before today = 30 days total
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the 30th day ago

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
  }, [records]);
  
  const chartData = useMemo(() => {
    return records.slice(0, 30).map(r => {
        const totalExpenses = calculateTotalExpenses(r);
        const totalSales = r.totalSales || 0;
        return {
            date: r.date,
            sales: totalSales,
            expenses: totalExpenses,
            profit: totalSales - totalExpenses
        };
    }).reverse();
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Welcome to Aysha's P&L</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tap the '+' button below to create your first record.</p>
      </div>
    );
  }

  const ProfitCard: React.FC<{ value: number, label: string, subLabel?: string }> = ({ value, label, subLabel }) => (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-sm">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm truncate">{label}</h3>
        <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${value >= 0 ? 'text-success' : 'text-error'}`}>
             ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        {subLabel && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subLabel}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Insight Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
             <ProfitCard 
                value={avg7DayProfit} 
                label="Avg Profit (7 Days)" 
             />
             <ProfitCard 
                value={avg30DayProfit} 
                label="Avg Profit (30 Days)" 
            />
            <ProfitCard 
                value={totalProfitAllTime} 
                label="Total Profit" 
                subLabel={`Across ${records.length} records`}
            />
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Profit/Loss Trend (Last 30 Records)</h3>
            <Chart data={chartData} />
        </div>

        {/* Recent Records */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 p-4 border-b border-slate-100 dark:border-slate-800">Recent Activity</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.slice(0, 5).map(record => {
                    const totalExpenses = calculateTotalExpenses(record);
                    const profit = (record.totalSales || 0) - totalExpenses;
                    return (
                        <li key={record.id} onClick={() => onViewRecord(record)} className="p-4 flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-4 flex-shrink-0">
                                <span className="font-bold text-primary text-sm">{new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric' })}</span>
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(record.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                            </div>
                             <p className={`font-bold text-lg text-right ml-2 ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                                {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
                            </p>
                        </li>
                    )
                })}
            </ul>
        </div>
    </div>
  );
};

export default Dashboard;