
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

  const { avg7DayProfit, daysFor7DayAvg, avg30DayProfit, daysFor30DayAvg } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recordsWithProfit = records.map(r => ({
      date: new Date(r.date),
      profit: r.totalSales - calculateTotalExpenses(r),
    }));

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const relevant7DayRecords = recordsWithProfit.filter(r => r.date >= sevenDaysAgo && r.date <= today);
    const total7DayProfit = relevant7DayRecords.reduce((sum, r) => sum + r.profit, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    const relevant30DayRecords = recordsWithProfit.filter(r => r.date >= thirtyDaysAgo && r.date <= today);
    const total30DayProfit = relevant30DayRecords.reduce((sum, r) => sum + r.profit, 0);

    return { 
        avg7DayProfit: relevant7DayRecords.length > 0 ? total7DayProfit / relevant7DayRecords.length : 0,
        daysFor7DayAvg: relevant7DayRecords.length,
        avg30DayProfit: relevant30DayRecords.length > 0 ? total30DayProfit / relevant30DayRecords.length : 0,
        daysFor30DayAvg: relevant30DayRecords.length 
    };
  }, [records]);
  
  const chartData = useMemo(() => {
    return records.slice(0, 30).map(r => {
        const totalExpenses = calculateTotalExpenses(r);
        return {
            date: r.date,
            sales: r.totalSales,
            expenses: totalExpenses,
            profit: r.totalSales - totalExpenses
        };
    }).reverse();
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-700">Welcome to Aysha's P&L</h2>
        <p className="text-slate-500 mt-2">Tap the '+' button below to create your first record.</p>
      </div>
    );
  }

  const ProfitCard: React.FC<{ value: number }> = ({ value }) => (
    <span className={`${value >= 0 ? 'text-success' : 'text-error'} font-bold`}>
        ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  );

  return (
    <div className="space-y-6">
        {/* Insight Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <h3 className="text-slate-500 font-medium text-sm">Avg. Profit (7d)</h3>
                <p className="text-2xl mt-1"><ProfitCard value={avg7DayProfit} /></p>
                <p className="text-xs text-slate-400 mt-1">{daysFor7DayAvg} days</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <h3 className="text-slate-500 font-medium text-sm">Avg. Profit (30d)</h3>
                <p className="text-2xl mt-1"><ProfitCard value={avg30DayProfit} /></p>
                <p className="text-xs text-slate-400 mt-1">{daysFor30DayAvg} days</p>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Profit/Loss Trend</h3>
            <Chart data={chartData} />
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 p-4 border-b border-slate-100">Recent Activity</h3>
            <ul className="divide-y divide-slate-100">
                {records.slice(0, 5).map(record => {
                    const totalExpenses = calculateTotalExpenses(record);
                    const profit = record.totalSales - totalExpenses;
                    return (
                        <li key={record.id} onClick={() => onViewRecord(record)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                            <div>
                                <p className="font-semibold text-slate-700">{new Date(record.date).toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</p>
                                <p className="text-sm text-slate-500">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                            </div>
                            <p className={`font-bold text-lg ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                                {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
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
