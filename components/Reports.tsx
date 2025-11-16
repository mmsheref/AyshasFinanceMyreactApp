import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';
import Chart from './Chart';
import SalesChart from './SalesChart';
import { DownloadIcon, InformationCircleIcon, XMarkIcon } from './Icons';
import { saveCsvFile } from '../utils/capacitor-utils';
import { convertToCSV } from '../utils/csv-utils';
import Modal from './Modal';

type FilterPreset = 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL_TIME' | 'CUSTOM';
type MetricType = 'NET_PROFIT' | 'PROFIT_MARGIN' | 'PRIME_COST' | 'FOOD_COST' | 'LABOR_COST' | 'TOTAL_SALES' | 'TOTAL_EXPENSES';

interface ModalInfo {
  title: string;
  value: string;
  description: string;
  calculation: {
    formula: string;
    values: string;
    categories?: string[];
  };
  analysis: {
    text: string;
    rating: 'good' | 'average' | 'warning' | 'info';
  };
}


const StatCard: React.FC<{ label: string; value: string; subValue?: string; className?: string, highlight?: boolean, onClick?: () => void }> = ({ label, value, subValue, className = '', highlight = false, onClick }) => (
    <button
        onClick={onClick}
        disabled={!onClick}
        className={`p-4 rounded-xl shadow-sm relative overflow-hidden w-full text-left transition-shadow duration-200 group ${onClick ? 'hover:shadow-md' : 'cursor-default'} ${highlight ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}
    >
        {highlight && <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>}
        <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
            {onClick && <InformationCircleIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />}
        </div>
        <p className={`text-2xl font-bold mt-1 truncate ${className}`}>{value}</p>
        {subValue && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subValue}</p>}
    </button>
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
    const { sortedRecords, foodCostCategories, reportCardVisibility } = useAppContext();
    const [filter, setFilter] = useState<FilterPreset>('THIS_MONTH');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [isPickerOpen, setPickerOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);

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
        let totalLaborCost = 0;
        let totalFoodCost = 0;
        let mostSales = { date: '', amount: 0 };
        let mostProfit = { date: '', amount: -Infinity };
        let leastProfit = { date: '', amount: Infinity };
        const categoryExpenses: { [key: string]: number } = {};
        const itemExpenses: { [key: string]: number } = {};

        for (const rec of filteredRecords) {
            const expenses = calculateTotalExpenses(rec);
            const profit = rec.totalSales - expenses;

            totalSales += rec.totalSales;
            totalExpenses += expenses;
            
            rec.expenses.forEach(cat => {
                const categoryTotal = cat.items.reduce((sum, item) => sum + item.amount, 0);
                
                if (cat.name.toLowerCase() === 'labours') {
                    totalLaborCost += categoryTotal;
                }
                if (foodCostCategories.includes(cat.name)) {
                    totalFoodCost += categoryTotal;
                }
                
                cat.items.forEach(item => {
                    if (item.amount > 0) {
                        itemExpenses[item.name] = (itemExpenses[item.name] || 0) + item.amount;
                    }
                });
                if (categoryTotal > 0) {
                    categoryExpenses[cat.name] = (categoryExpenses[cat.name] || 0) + categoryTotal;
                }
            });

            if (rec.totalSales > mostSales.amount) {
                mostSales = { date: rec.date, amount: rec.totalSales };
            }
            if (profit > mostProfit.amount) {
                mostProfit = { date: rec.date, amount: profit };
            }
            if (profit < leastProfit.amount) {
                leastProfit = { date: rec.date, amount: profit };
            }
        }
        
        const topCategories = Object.entries(categoryExpenses)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

        const topItems = Object.entries(itemExpenses)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
            
        const primeCost = totalLaborCost + totalFoodCost;

        return {
            totalSales,
            totalExpenses,
            totalLaborCost,
            totalFoodCost,
            netProfit: totalSales - totalExpenses,
            profitMargin: totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0,
            laborCostPercentage: totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0,
            foodCostPercentage: totalSales > 0 ? (totalFoodCost / totalSales) * 100 : 0,
            primeCostPercentage: totalSales > 0 ? (primeCost / totalSales) * 100 : 0,
            avgDailySales: filteredRecords.length > 0 ? totalSales / filteredRecords.length : 0,
            avgDailyProfit: filteredRecords.length > 0 ? (totalSales - totalExpenses) / filteredRecords.length : 0,
            busiestDay: mostSales,
            mostProfitableDay: mostProfit,
            leastProfitableDay: leastProfit.amount === Infinity ? { date: '', amount: 0 } : leastProfit,
            topCategories,
            topItems,
        };
    }, [filteredRecords, foodCostCategories]);
    
    const openMetricModal = (metric: MetricType) => {
        const { totalSales, totalExpenses, totalFoodCost, totalLaborCost, netProfit, profitMargin, primeCostPercentage, foodCostPercentage, laborCostPercentage } = reportData;
        let info: ModalInfo | null = null;
        
        const formatAsRupee = (num: number) => `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

        switch(metric) {
            case 'NET_PROFIT':
                info = {
                    title: 'Net Profit', value: formatAsRupee(netProfit),
                    description: "The total money your business earned after subtracting all expenses. It's the ultimate measure of profitability.",
                    calculation: { formula: 'Total Sales - Total Expenses', values: `${formatAsRupee(totalSales)} - ${formatAsRupee(totalExpenses)}` },
                    analysis: {
                        text: netProfit >= 0 ? 'Your business is profitable in this period.' : 'Your business has a loss in this period.',
                        rating: netProfit >= 0 ? 'good' : 'warning',
                    }
                };
                break;
            case 'PROFIT_MARGIN':
                info = {
                    title: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`,
                    description: "The percentage of sales that has turned into profit. A higher percentage shows how efficiently you convert revenue into actual profit.",
                    calculation: { formula: '(Net Profit / Total Sales) * 100', values: `(${formatAsRupee(netProfit)} / ${formatAsRupee(totalSales)}) * 100` },
                    analysis: profitMargin > 15 
                        ? { text: 'Excellent! This is a very healthy profit margin for a fast-food business in India.', rating: 'good' }
                        : profitMargin > 5
                        ? { text: 'Good. This is a solid and sustainable profit margin.', rating: 'average' }
                        : { text: 'Needs Attention. This margin is low. Look for ways to increase sales or reduce costs.', rating: 'warning' }
                };
                break;
            case 'PRIME_COST':
                info = {
                    title: 'Prime Cost %', value: `${primeCostPercentage.toFixed(1)}%`,
                    description: "The total of your food and labor costs, as a percentage of sales. This is the single most important metric for controlling costs in a restaurant.",
                    calculation: { 
                        formula: '((Food Costs + Labor Costs) / Total Sales) * 100', 
                        values: `((${formatAsRupee(totalFoodCost)} + ${formatAsRupee(totalLaborCost)}) / ${formatAsRupee(totalSales)}) * 100`,
                        categories: foodCostCategories
                    },
                    analysis: primeCostPercentage < 60
                        ? { text: 'Excellent! Your core costs are very well-controlled, which is key to high profitability.', rating: 'good' }
                        : primeCostPercentage < 65
                        ? { text: 'Good. You are within the ideal range for a healthy fast-food business.', rating: 'average' }
                        : { text: 'Needs Attention. Your prime costs are high. Focus on managing food waste, portion control, or staff scheduling.', rating: 'warning' }
                };
                break;
            case 'FOOD_COST':
                info = {
                    title: 'Food Cost %', value: `${foodCostPercentage.toFixed(1)}%`,
                    description: "The percentage of sales spent on food ingredients. Keeping this number low is crucial for profitability.",
                    calculation: { 
                        formula: '(Total Food Costs / Total Sales) * 100', 
                        values: `(${formatAsRupee(totalFoodCost)} / ${formatAsRupee(totalSales)}) * 100`,
                        categories: foodCostCategories
                    },
                    analysis: foodCostPercentage < 30
                        ? { text: 'Excellent! Your food costs are very low, which significantly boosts your profit margin.', rating: 'good' }
                        : foodCostPercentage < 35
                        ? { text: 'Good. This is a healthy and typical range for food costs in the industry.', rating: 'average' }
                        : { text: 'Needs Attention. Your food costs are high. Review your menu pricing, supplier costs, and kitchen waste.', rating: 'warning' }
                };
                break;
            case 'LABOR_COST':
                 info = {
                    title: 'Labor Cost %', value: `${laborCostPercentage.toFixed(1)}%`,
                    description: "The percentage of sales spent on all staff salaries and wages. Efficient staffing is key to managing this cost.",
                    calculation: { formula: '(Total Labor Costs / Total Sales) * 100', values: `(${formatAsRupee(totalLaborCost)} / ${formatAsRupee(totalSales)}) * 100` },
                    analysis: laborCostPercentage < 30
                        ? { text: 'Excellent! Your labor costs are well-managed, indicating efficient staffing and scheduling.', rating: 'good' }
                        : laborCostPercentage < 35
                        ? { text: 'Good. This is a standard and sustainable range for labor costs in your industry.', rating: 'average' }
                        : { text: 'Needs Attention. Your labor costs are high. Consider optimizing staff schedules based on peak hours.', rating: 'warning' }
                };
                break;
            case 'TOTAL_SALES':
                info = {
                    title: 'Total Sales', value: formatAsRupee(totalSales),
                    description: "The total revenue generated from all sales activities within the selected period before any expenses are deducted.",
                    calculation: { formula: 'Sum of all daily sales', values: 'This is the top-line figure of your business.' },
                    analysis: { text: 'Higher sales provide more opportunity for profit.', rating: 'info' }
                };
                break;
            case 'TOTAL_EXPENSES':
                 info = {
                    title: 'Total Expenses', value: formatAsRupee(totalExpenses),
                    description: "The sum of all costs incurred to generate sales, including food, labor, rent, and other operational costs.",
                    calculation: { formula: 'Sum of all daily expenses', values: 'This includes all cost categories you have recorded.' },
                    analysis: { text: 'Keeping expenses low is critical to maximizing profit.', rating: 'info' }
                };
                break;
        }

        if (info) setModalInfo(info);
    };

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

    const ratingStyles = {
        good: { dot: 'bg-success', text: 'text-success' },
        average: { dot: 'bg-yellow-500', text: 'text-yellow-500' },
        warning: { dot: 'bg-error', text: 'text-red-500' },
        info: { dot: 'bg-blue-500', text: 'text-blue-500' },
    };

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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reportCardVisibility.NET_PROFIT && <StatCard highlight label="Net Profit" value={`₹${reportData.netProfit.toLocaleString('en-IN')}`} className={reportData.netProfit >= 0 ? 'text-success' : 'text-error'} onClick={() => openMetricModal('NET_PROFIT')} />}
                {reportCardVisibility.PROFIT_MARGIN && <StatCard highlight label="Profit Margin" value={`${reportData.profitMargin.toFixed(1)}%`} className={reportData.profitMargin >= 0 ? 'text-success' : 'text-error'} onClick={() => openMetricModal('PROFIT_MARGIN')} />}
                {reportCardVisibility.PRIME_COST && <StatCard highlight label="Prime Cost %" value={`${reportData.primeCostPercentage.toFixed(1)}%`} subValue="Food + Labor" onClick={() => openMetricModal('PRIME_COST')} />}
                
                {reportCardVisibility.TOTAL_SALES && <StatCard label="Total Sales" value={`₹${reportData.totalSales.toLocaleString('en-IN')}`} onClick={() => openMetricModal('TOTAL_SALES')} />}
                {reportCardVisibility.TOTAL_EXPENSES && <StatCard label="Total Expenses" value={`₹${reportData.totalExpenses.toLocaleString('en-IN')}`} onClick={() => openMetricModal('TOTAL_EXPENSES')} />}
                {reportCardVisibility.FOOD_COST && <StatCard label="Food Cost %" value={`${reportData.foodCostPercentage.toFixed(1)}%`} subValue="Of Total Sales" onClick={() => openMetricModal('FOOD_COST')} />}
                {reportCardVisibility.LABOR_COST && <StatCard label="Labor Cost %" value={`${reportData.laborCostPercentage.toFixed(1)}%`} subValue="Of Total Sales" onClick={() => openMetricModal('LABOR_COST')}/>}
                {reportCardVisibility.AVG_DAILY_SALES && <StatCard label="Avg. Daily Sales" value={`₹${reportData.avgDailySales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} subValue={`Over ${filteredRecords.length} days`} />}
                {reportCardVisibility.AVG_DAILY_PROFIT && <StatCard label="Avg. Daily Profit" value={`₹${reportData.avgDailyProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} subValue={`Over ${filteredRecords.length} days`} />}
                
                {reportCardVisibility.BUSIEST_DAY && <StatCard label="Busiest Day (Sales)" value={reportData.busiestDay.date ? formatDate(reportData.busiestDay.date) : 'N/A'} subValue={reportData.busiestDay.date ? `₹${reportData.busiestDay.amount.toLocaleString('en-IN')}` : ''} />}
                {reportCardVisibility.MOST_PROFITABLE_DAY && <StatCard label="Most Profitable Day" value={reportData.mostProfitableDay.date ? formatDate(reportData.mostProfitableDay.date) : 'N/A'} subValue={reportData.mostProfitableDay.date ? `+₹${reportData.mostProfitableDay.amount.toLocaleString('en-IN')}` : ''} />}
                {reportCardVisibility.LEAST_PROFITABLE_DAY && <StatCard label="Least Profitable Day" value={reportData.leastProfitableDay.date ? formatDate(reportData.leastProfitableDay.date) : 'N/A'} subValue={reportData.leastProfitableDay.date ? `₹${reportData.leastProfitableDay.amount.toLocaleString('en-IN')}` : ''} />}
            </div>

            {modalInfo && (
                <Modal onClose={() => setModalInfo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
                        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{modalInfo.title}</h2>
                            <button onClick={() => setModalInfo(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
                                <XMarkIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-wide uppercase">What it is</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{modalInfo.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-wide uppercase">Your Calculation</h3>
                                <div className="p-4 bg-slate-100 dark:bg-slate-800/70 rounded-lg space-y-3 text-center">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-mono" aria-label="Formula">{modalInfo.calculation.formula}</p>
                                    <p className="text-lg font-semibold text-primary break-words" aria-label="Values">{modalInfo.calculation.values}</p>
                                    <div className="flex items-center justify-center text-primary/50">
                                        <div className="h-px flex-grow bg-primary/20"></div>
                                        <p className="mx-2 font-bold text-xl">=</p>
                                        <div className="h-px flex-grow bg-primary/20"></div>
                                    </div>
                                    <p className="font-bold text-3xl text-primary" aria-label="Result">{modalInfo.value}</p>
                                </div>
                                {modalInfo.calculation.categories && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center px-2">
                                        Calculated using these Food Cost categories: <span className="font-medium">{modalInfo.calculation.categories.join(', ')}</span>. You can change this in Settings.
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-wide uppercase">Analysis</h3>
                                <div className="flex items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full mt-1.5 mr-3 ${ratingStyles[modalInfo.analysis.rating].dot}`}></div>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <span className={`font-semibold ${ratingStyles[modalInfo.analysis.rating].text}`}>{modalInfo.analysis.rating.charAt(0).toUpperCase() + modalInfo.analysis.rating.slice(1)} Performance. </span>
                                        {modalInfo.analysis.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

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