import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';
import Chart from './Chart';
import SalesChart from './SalesChart';
import { DownloadIcon } from './Icons';
import { saveCsvFile } from '../utils/capacitor-utils';
import { convertToCSV } from '../utils/csv-utils';

type FilterPreset = 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL_TIME' | 'CUSTOM';

const StatCard: React.FC<{ label: string; value: string; subValue?: string; className?: string }> = ({ label, value, subValue, className = '' }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 truncate ${className}`}>{value}</p>
        {subValue && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subValue}</p>}
    </div>
);

const CHART_COLORS = ['#7c3aed', '#14b8a6', '#f97316', '#ef4444', '#3b82f6', '#84cc16', '#f59e0b', '#ec4899'];

const ExpenseDonutChart: React.FC<{ data: { name: string, value: number, color: string }[], total: number }> = ({ data, total }) => {
    if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500">No expense data</div>;

    const conicGradientSegments = [];
    let cumulativePercentage = 0;
    for (const item of data) {
        const percentage = (item.value / total) * 100;
        conicGradientSegments.push(`${item.color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`);
        cumulativePercentage += percentage;
    }
    const gradient = `conic-gradient(${conicGradientSegments.join(', ')})`;

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
                <div className="absolute inset-0 rounded-full" style={{ background: gradient }}></div>
                <div className="absolute inset-2 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                        <p className="font-bold text-lg">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
            <ul className="space-y-2 text-sm w-full">
                {data.map(item => (
                    <li key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold">₹{item.value.toLocaleString('en-IN')}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{((item.value / total) * 100).toFixed(1)}%</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Reports: React.FC = () => {
    const { sortedRecords } = useAppContext();
    const [filter, setFilter] = useState<FilterPreset>('THIS_MONTH');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [isPickerOpen, setPickerOpen] = useState(false);

    const finishedRecords = useMemo(() => sortedRecords.filter(r => r.totalSales > 0), [sortedRecords]);

    const filteredRecords = useMemo(() => {
        let startDate: Date | null = null;
        let endDate: Date | null = new Date();
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday - 0, Saturday - 6

        switch (filter) {
            case 'THIS_WEEK':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'LAST_WEEK':
                endDate = new Date(today);
                endDate.setDate(today.getDate() - dayOfWeek - 1);
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'THIS_MONTH':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'LAST_MONTH':
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'CUSTOM':
                startDate = dateRange.startDate ? new Date(dateRange.startDate + 'T00:00:00') : null;
                endDate = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null;
                break;
            case 'ALL_TIME':
            default:
                startDate = null;
                endDate = null;
        }

        return finishedRecords.filter(rec => {
            const recDate = new Date(rec.date);
            if (startDate && recDate < startDate) return false;
            if (endDate && recDate > endDate) return false;
            return true;
        });
    }, [filter, dateRange, finishedRecords]);

    const reportData = useMemo(() => {
        let totalSales = 0;
        let totalExpenses = 0;
        let mostSales = { date: '', amount: 0 };
        let mostProfit = { date: '', amount: -Infinity };
        const categoryExpenses: { [key: string]: number } = {};
        const itemExpenses: { [key: string]: number } = {};

        for (const rec of filteredRecords) {
            const expenses = calculateTotalExpenses(rec);
            const profit = rec.totalSales - expenses;

            totalSales += rec.totalSales;
            totalExpenses += expenses;

            if (rec.totalSales > mostSales.amount) {
                mostSales = { date: rec.date, amount: rec.totalSales };
            }
            if (profit > mostProfit.amount) {
                mostProfit = { date: rec.date, amount: profit };
            }

            rec.expenses.forEach(cat => {
                let catTotal = 0;
                cat.items.forEach(item => {
                    if (item.amount > 0) {
                        catTotal += item.amount;
                        itemExpenses[item.name] = (itemExpenses[item.name] || 0) + item.amount;
                    }
                });
                if (catTotal > 0) {
                    categoryExpenses[cat.name] = (categoryExpenses[cat.name] || 0) + catTotal;
                }
            });
        }
        
        const topCategories = Object.entries(categoryExpenses)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

        const topItems = Object.entries(itemExpenses)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            totalSales,
            totalExpenses,
            netProfit: totalSales - totalExpenses,
            profitMargin: totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0,
            avgDailySales: filteredRecords.length > 0 ? totalSales / filteredRecords.length : 0,
            avgDailyProfit: filteredRecords.length > 0 ? (totalSales - totalExpenses) / filteredRecords.length : 0,
            busiestDay: mostSales,
            mostProfitableDay: mostProfit,
            topCategories,
            topItems,
        };
    }, [filteredRecords]);

    const chartData = useMemo(() => {
        const ascendingRecords = [...filteredRecords].reverse();
        return ascendingRecords.map(r => {
            const totalExpenses = calculateTotalExpenses(r);
            const totalSales = r.totalSales || 0;
            return {
                date: r.date,
                sales: totalSales,
                expenses: totalExpenses,
                profit: totalSales - totalExpenses,
            };
        });
    }, [filteredRecords]);

    const salesChartData = useMemo(() => {
        const ascendingRecords = [...filteredRecords].reverse();
        return ascendingRecords.map(r => {
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
    }, [filteredRecords]);

    const handleFilterChange = (newFilter: FilterPreset) => {
        setFilter(newFilter);
        if (newFilter === 'CUSTOM') {
            setPickerOpen(true);
        } else {
            setDateRange({ startDate: '', endDate: '' });
        }
    };

    const handleApplyDateRange = (range: { startDate: string, endDate: string }) => {
        setDateRange(range);
        setFilter('CUSTOM');
    };
    
    const handleExport = async () => {
        if (filteredRecords.length === 0) {
            alert("No data in the selected range to export.");
            return;
        }
        try {
            const csvData = convertToCSV(filteredRecords);
            const dateStr = new Date().toISOString().split('T')[0];
            const start = filter === 'CUSTOM' && dateRange.startDate ? `_from_${dateRange.startDate}` : '';
            const end = filter === 'CUSTOM' && dateRange.endDate ? `_to_${dateRange.endDate}`: '';
            const filterName = filter !== 'CUSTOM' ? `_${filter}` : '';
            const fileName = `ayshas-report${filterName}${start}${end}_${dateStr}.csv`;
            await saveCsvFile(fileName, csvData);
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('An error occurred during CSV export.');
        }
    };

    const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const getFilterButtonText = (f: FilterPreset) => {
        if (f === 'CUSTOM' && dateRange.startDate) {
            return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate || dateRange.startDate)}`;
        }
        const map: Record<FilterPreset, string> = {
            THIS_WEEK: 'This Week', LAST_WEEK: 'Last Week', THIS_MONTH: 'This Month',
            LAST_MONTH: 'Last Month', ALL_TIME: 'All Time', CUSTOM: 'Custom'
        };
        return map[f];
    }
    
    if (finishedRecords.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">No Completed Records</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Complete a record by adding sales to see reports.</p>
            </div>
        );
    }

    const filterOptions: FilterPreset[] = ['THIS_MONTH', 'LAST_MONTH', 'THIS_WEEK', 'ALL_TIME'];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map(f => (
                        <button key={f} onClick={() => handleFilterChange(f)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{getFilterButtonText(f)}</button>
                    ))}
                    <button onClick={() => handleFilterChange('CUSTOM')} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors truncate max-w-xs ${filter === 'CUSTOM' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{getFilterButtonText('CUSTOM')}</button>
                </div>
                <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                    <DownloadIcon className="w-4 h-4" />
                    Export Filtered Data as CSV
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Net Profit" value={`₹${reportData.netProfit.toLocaleString('en-IN')}`} className={reportData.netProfit >= 0 ? 'text-success' : 'text-error'} />
                <StatCard label="Profit Margin" value={`${reportData.profitMargin.toFixed(1)}%`} className={reportData.profitMargin >= 0 ? 'text-success' : 'text-error'} />
                <StatCard label="Total Sales" value={`₹${reportData.totalSales.toLocaleString('en-IN')}`} />
                <StatCard label="Total Expenses" value={`₹${reportData.totalExpenses.toLocaleString('en-IN')}`} />
                <StatCard label="Avg. Daily Sales" value={`₹${reportData.avgDailySales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} subValue={`Over ${filteredRecords.length} days`} />
                <StatCard label="Avg. Daily Profit" value={`₹${reportData.avgDailyProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} subValue={`Over ${filteredRecords.length} days`} />
                <StatCard label="Most Profitable Day" value={reportData.mostProfitableDay.date ? formatDate(reportData.mostProfitableDay.date) : 'N/A'} subValue={reportData.mostProfitableDay.date ? `+₹${reportData.mostProfitableDay.amount.toLocaleString('en-IN')}` : ''} />
                <StatCard label="Busiest Day (Sales)" value={reportData.busiestDay.date ? formatDate(reportData.busiestDay.date) : 'N/A'} subValue={reportData.busiestDay.date ? `₹${reportData.busiestDay.amount.toLocaleString('en-IN')}` : ''} />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Sales Trend (Morning vs. Night)</h3>
                <SalesChart data={salesChartData} />
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Profit/Loss Trend</h3>
                <Chart data={chartData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Expense Breakdown by Category</h3>
                    <ExpenseDonutChart data={reportData.topCategories} total={reportData.totalExpenses} />
                </div>
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Top Expense Items</h3>
                    {reportData.topItems.length > 0 ? (
                        <ul className="space-y-3">
                        {reportData.topItems.map(([name, value]) => (
                            <li key={name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
                                    <span className="font-semibold">₹{value.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(value / reportData.topItems[0][1]) * 100}%` }}></div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    ) : <div className="h-48 flex items-center justify-center text-slate-500">No expense data</div>}
                </div>
            </div>

            <DateRangePicker isOpen={isPickerOpen} onClose={() => setPickerOpen(false)} onApply={handleApplyDateRange} initialRange={dateRange} />
        </div>
    );
};

export default Reports;