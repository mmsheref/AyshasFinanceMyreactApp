
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateTotalExpenses, getTodayDateString, getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange, formatIndianNumberCompact } from '../utils/record-utils';
import DateRangePicker from './DateRangePicker';
import ExpenseProfitChart from './ExpenseProfitChart';
import SalesChart from './SalesChart';
import { DownloadIcon, InformationCircleIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
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

// Improved Card Design for "Native" Feel
const ReportCard: React.FC<{ 
    label: string; 
    value: string; 
    subValue?: string; 
    onClick?: () => void;
    highlight?: boolean;
}> = ({ label, value, subValue, onClick, highlight = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`
                relative overflow-hidden w-full text-left p-4 rounded-[20px] transition-transform duration-200 
                ${onClick ? 'active:scale-[0.98]' : 'cursor-default'}
                ${highlight 
                    ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' 
                    : 'bg-surface-container dark:bg-surface-dark-container text-surface-on dark:text-surface-on-dark'
                }
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'opacity-80' : 'text-surface-on-variant dark:text-surface-on-variant-dark'}`}>{label}</span>
                {onClick && <InformationCircleIcon className={`w-4 h-4 ${highlight ? 'text-primary-on-container' : 'text-surface-outline dark:text-surface-outline-dark'}`} />}
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight leading-none`}>{value}</span>
            </div>
            {subValue && <p className={`text-xs mt-2 ${highlight ? 'opacity-70' : 'text-surface-on-variant dark:text-surface-on-variant-dark'}`}>{subValue}</p>}
        </button>
    );
};


const CHART_COLORS = ['#6750A4', '#9A82DB', '#B69DF8', '#EADDFF', '#D0BCFF'];

const ExpenseDonutChart: React.FC<{ data: { name: string, value: number, color: string }[], total: number }> = ({ data, total }) => {
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-sm text-surface-on-variant dark:text-surface-on-variant-dark">No expense data</div>;

    const conicGradientSegments = [];
    let cumulativePercentage = 0;
    for (const item of data) {
        const percentage = (item.value / total) * 100;
        conicGradientSegments.push(`${item.color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`);
        cumulativePercentage += percentage;
    }
    const gradient = `conic-gradient(${conicGradientSegments.join(', ')})`;

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
                <div className="absolute inset-0 rounded-full" style={{ background: gradient }}></div>
                <div className="absolute inset-4 bg-surface-container-low dark:bg-surface-dark-container-low rounded-full flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[10px] text-surface-on-variant dark:text-surface-on-variant-dark font-medium uppercase">Total</p>
                        <p className="font-bold text-base text-surface-on dark:text-surface-on-dark">₹{formatIndianNumberCompact(total)}</p>
                    </div>
                </div>
            </div>
            <div className="w-full space-y-2">
                {data.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center truncate mr-2">
                            <span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-surface-on dark:text-surface-on-dark truncate">{item.name}</span>
                        </div>
                        <span className="text-surface-on-variant dark:text-surface-on-variant-dark font-medium">
                            {((item.value / total) * 100).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Reports: React.FC = () => {
    const { sortedRecords, foodCostCategories, reportCardVisibility } = useAppContext();
    const [filter, setFilter] = useState<FilterPreset>('THIS_MONTH');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [isPickerOpen, setPickerOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState<ModalInfo | null>(null);
    const [showAllExpenses, setShowAllExpenses] = useState(false);

    // Filter out closed days for reports, but include days with > 0 sales OR expenses (loss days)
    const finishedRecords = useMemo(() => sortedRecords.filter(r => !r.isClosed && (r.totalSales > 0 || calculateTotalExpenses(r) > 0)), [sortedRecords]);

    const filteredRecords = useMemo(() => {
        let startStr = '';
        let endStr = '';

        switch (filter) {
            case 'THIS_WEEK':
                ({ start: startStr, end: endStr } = getThisWeekRange());
                break;
            case 'LAST_WEEK':
                ({ start: startStr, end: endStr } = getLastWeekRange());
                break;
            case 'THIS_MONTH':
                ({ start: startStr, end: endStr } = getThisMonthRange());
                break;
            case 'LAST_MONTH':
                ({ start: startStr, end: endStr } = getLastMonthRange());
                break;
            case 'CUSTOM':
                startStr = dateRange.startDate;
                endStr = dateRange.endDate;
                break;
            case 'ALL_TIME':
            default:
                return finishedRecords;
        }

        return finishedRecords.filter(rec => {
            const afterStart = !startStr || rec.date >= startStr;
            const beforeEnd = !endStr || rec.date <= endStr;
            return afterStart && beforeEnd;
        });
    }, [filter, dateRange, finishedRecords]);

    // Create a sorted copy of filtered records once to avoid repeated sorting in chart data
    const sortedFilteredRecords = useMemo(() => {
        return [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredRecords]);

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

        // Sorted list of ALL items high to low
        const sortedExpenseItems = Object.entries(itemExpenses)
            .sort(([, a], [, b]) => b - a);
            
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
            sortedExpenseItems,
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
                    description: "The total money your business earned after subtracting all expenses.",
                    calculation: { formula: 'Total Sales - Total Expenses', values: `${formatAsRupee(totalSales)} - ${formatAsRupee(totalExpenses)}` },
                    analysis: {
                        text: netProfit >= 0 ? 'Profitable period.' : 'Loss period.',
                        rating: netProfit >= 0 ? 'good' : 'warning',
                    }
                };
                break;
            case 'PROFIT_MARGIN':
                info = {
                    title: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`,
                    description: "Percentage of sales that turned into profit.",
                    calculation: { formula: '(Net Profit / Total Sales) * 100', values: `(${formatAsRupee(netProfit)} / ${formatAsRupee(totalSales)}) * 100` },
                    analysis: profitMargin > 15 
                        ? { text: 'Excellent margin.', rating: 'good' }
                        : profitMargin > 5
                        ? { text: 'Healthy margin.', rating: 'average' }
                        : { text: 'Low margin.', rating: 'warning' }
                };
                break;
            case 'PRIME_COST':
                info = {
                    title: 'Prime Cost %', value: `${primeCostPercentage.toFixed(1)}%`,
                    description: "Food + Labor costs as a percentage of sales. Crucial for cost control.",
                    calculation: { 
                        formula: '((Food + Labor) / Sales) * 100', 
                        values: `((${formatAsRupee(totalFoodCost)} + ${formatAsRupee(totalLaborCost)}) / ${formatAsRupee(totalSales)}) * 100`,
                        categories: foodCostCategories
                    },
                    analysis: primeCostPercentage < 60
                        ? { text: 'Costs well controlled.', rating: 'good' }
                        : primeCostPercentage < 65
                        ? { text: 'Acceptable range.', rating: 'average' }
                        : { text: 'Costs are high.', rating: 'warning' }
                };
                break;
            case 'FOOD_COST':
                info = {
                    title: 'Food Cost %', value: `${foodCostPercentage.toFixed(1)}%`,
                    description: "Percentage of sales spent on ingredients.",
                    calculation: { 
                        formula: '(Food Costs / Sales) * 100', 
                        values: `(${formatAsRupee(totalFoodCost)} / ${formatAsRupee(totalSales)}) * 100`,
                        categories: foodCostCategories
                    },
                    analysis: foodCostPercentage < 30
                        ? { text: 'Excellent cost control.', rating: 'good' }
                        : foodCostPercentage < 35
                        ? { text: 'Average range.', rating: 'average' }
                        : { text: 'High food costs.', rating: 'warning' }
                };
                break;
            case 'LABOR_COST':
                 info = {
                    title: 'Labor Cost %', value: `${laborCostPercentage.toFixed(1)}%`,
                    description: "Percentage of sales spent on staff.",
                    calculation: { formula: '(Labor Costs / Sales) * 100', values: `(${formatAsRupee(totalLaborCost)} / ${formatAsRupee(totalSales)}) * 100` },
                    analysis: laborCostPercentage < 30
                        ? { text: 'Efficient staffing.', rating: 'good' }
                        : laborCostPercentage < 35
                        ? { text: 'Standard range.', rating: 'average' }
                        : { text: 'High labor costs.', rating: 'warning' }
                };
                break;
            case 'TOTAL_SALES':
                info = {
                    title: 'Total Sales', value: formatAsRupee(totalSales),
                    description: "Total revenue before expenses.",
                    calculation: { formula: 'Sum of daily sales', values: 'Total revenue.' },
                    analysis: { text: 'Revenue generated.', rating: 'info' }
                };
                break;
            case 'TOTAL_EXPENSES':
                 info = {
                    title: 'Total Expenses', value: formatAsRupee(totalExpenses),
                    description: "Total operational costs.",
                    calculation: { formula: 'Sum of daily expenses', values: 'Total costs.' },
                    analysis: { text: 'Costs incurred.', rating: 'info' }
                };
                break;
        }

        if (info) setModalInfo(info);
    };

    const chartData = useMemo(() => {
        return sortedFilteredRecords.map(r => {
            const totalExpenses = calculateTotalExpenses(r);
            const totalSales = r.totalSales || 0;
            return {
                date: r.date,
                sales: totalSales,
                expenses: totalExpenses,
                profit: totalSales - totalExpenses,
            };
        });
    }, [sortedFilteredRecords]);

    const salesChartData = useMemo(() => {
        return sortedFilteredRecords.map(r => {
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
    }, [sortedFilteredRecords]);

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
            const dateStr = getTodayDateString();
            const fileName = `ayshas-report_${dateStr}.csv`;
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
            <div className="text-center py-20 px-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark">No Completed Records</h2>
                <p className="text-surface-on-variant dark:text-surface-on-variant-dark mt-2 text-sm">Add sales to your records to unlock analytics.</p>
            </div>
        );
    }

    const filterOptions: FilterPreset[] = ['THIS_MONTH', 'LAST_MONTH', 'THIS_WEEK', 'ALL_TIME'];

    const displayedExpenses = showAllExpenses ? reportData.sortedExpenseItems : reportData.sortedExpenseItems.slice(0, 5);

    return (
        <div className="space-y-4 pb-6 pt-4">
            {/* Filter Chips - Horizontal Scroll */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 py-1">
                {filterOptions.map(f => (
                    <button key={f} onClick={() => handleFilterChange(f)} className={`px-4 py-1.5 whitespace-nowrap text-sm font-medium rounded-lg transition-colors border ${filter === f ? 'bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark border-transparent' : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark border-surface-outline/30 dark:border-surface-outline-dark/30'}`}>{getFilterButtonText(f)}</button>
                ))}
                <button onClick={() => handleFilterChange('CUSTOM')} className={`px-4 py-1.5 whitespace-nowrap text-sm font-medium rounded-lg transition-colors border ${filter === 'CUSTOM' ? 'bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark border-transparent' : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark border-surface-outline/30 dark:border-surface-outline-dark/30'}`}>{getFilterButtonText('CUSTOM')}</button>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {reportCardVisibility.NET_PROFIT && (
                    <div className="col-span-2">
                        <ReportCard 
                            label="Net Profit" 
                            value={`₹${reportData.netProfit.toLocaleString('en-IN')}`} 
                            highlight
                            onClick={() => openMetricModal('NET_PROFIT')} 
                        />
                    </div>
                )}
                {reportCardVisibility.PROFIT_MARGIN && <ReportCard label="Profit Margin" value={`${reportData.profitMargin.toFixed(1)}%`} onClick={() => openMetricModal('PROFIT_MARGIN')} />}
                {reportCardVisibility.PRIME_COST && <ReportCard label="Prime Cost" value={`${reportData.primeCostPercentage.toFixed(1)}%`} onClick={() => openMetricModal('PRIME_COST')} />}
                
                {reportCardVisibility.TOTAL_SALES && <ReportCard label="Sales" value={`₹${formatIndianNumberCompact(reportData.totalSales)}`} onClick={() => openMetricModal('TOTAL_SALES')} />}
                {reportCardVisibility.TOTAL_EXPENSES && <ReportCard label="Expenses" value={`₹${formatIndianNumberCompact(reportData.totalExpenses)}`} onClick={() => openMetricModal('TOTAL_EXPENSES')} />}
            </div>
            
            {/* Secondary Metrics Scroll or Grid */}
            <div className="grid grid-cols-3 gap-2">
                 {reportCardVisibility.FOOD_COST && <ReportCard label="Food %" value={`${reportData.foodCostPercentage.toFixed(0)}%`} onClick={() => openMetricModal('FOOD_COST')} />}
                 {reportCardVisibility.LABOR_COST && <ReportCard label="Labor %" value={`${reportData.laborCostPercentage.toFixed(0)}%`} onClick={() => openMetricModal('LABOR_COST')}/>}
                 {reportCardVisibility.AVG_DAILY_PROFIT && <ReportCard label="Avg Profit" value={`₹${formatIndianNumberCompact(reportData.avgDailyProfit)}`} />}
            </div>

            {/* Charts Area */}
            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark mb-4 px-1">Daily Performance</h3>
                <ExpenseProfitChart data={chartData} />
            </div>

            <div className="bg-surface-container-low dark:bg-surface-dark-container-low rounded-[20px] p-4">
                <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark mb-4 px-1">Sales Split</h3>
                <SalesChart data={salesChartData} />
            </div>

            {/* Expenses Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-surface-container-low dark:bg-surface-dark-container-low p-5 rounded-[20px]">
                    <h3 className="text-sm font-medium mb-4 text-surface-on dark:text-surface-on-dark">Expense Categories</h3>
                    <ExpenseDonutChart data={reportData.topCategories} total={reportData.totalExpenses} />
                </div>
                 <div className={`bg-surface-container-low dark:bg-surface-dark-container-low p-5 rounded-[20px] transition-all duration-300 ${showAllExpenses ? 'row-span-2' : ''}`}>
                    <div 
                        className="flex justify-between items-center mb-4 cursor-pointer group select-none"
                        onClick={() => setShowAllExpenses(!showAllExpenses)}
                    >
                        <h3 className="text-sm font-medium text-surface-on dark:text-surface-on-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                            {showAllExpenses ? 'All Expenses' : 'Top Expenses'}
                        </h3>
                        {reportData.sortedExpenseItems.length > 5 && (
                            <button className="flex items-center text-xs font-medium text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary-dark/10 px-2 py-1 rounded-full transition-colors group-hover:bg-primary/20 dark:group-hover:bg-primary-dark/20">
                                {showAllExpenses ? (
                                    <>Collapse <ChevronUpIcon className="w-3 h-3 ml-1" /></>
                                ) : (
                                    <>View All <ChevronDownIcon className="w-3 h-3 ml-1" /></>
                                )}
                            </button>
                        )}
                    </div>
                    {reportData.sortedExpenseItems.length > 0 ? (
                        <div className={`space-y-4 ${showAllExpenses ? 'max-h-[60vh] overflow-y-auto pr-1' : ''}`}>
                        {displayedExpenses.map(([name, value], i) => (
                            <div key={name} className="relative">
                                <div className="flex justify-between text-xs mb-1.5 relative z-10">
                                    <span className="font-medium text-surface-on dark:text-surface-on-dark">{name}</span>
                                    <span className="font-semibold text-surface-on dark:text-surface-on-dark">₹{value.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-surface-container-high dark:bg-surface-dark-container-high rounded-full h-2 overflow-hidden">
                                    <div className="bg-primary dark:bg-primary-dark h-full rounded-full" style={{ width: `${(value / reportData.sortedExpenseItems[0][1]) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    ) : <div className="h-40 flex items-center justify-center text-sm text-surface-on-variant dark:text-surface-on-variant-dark">No data</div>}
                </div>
            </div>

            {/* Export Action */}
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-primary dark:text-primary-dark border border-dashed border-primary/40 dark:border-primary-dark/40 rounded-[20px] hover:bg-primary-container/10 transition-colors">
                <DownloadIcon className="w-5 h-5" />
                Export Report as CSV
            </button>

            <DateRangePicker isOpen={isPickerOpen} onClose={() => setPickerOpen(false)} onApply={handleApplyDateRange} initialRange={dateRange} />
            
            {modalInfo && (
                <Modal onClose={() => setModalInfo(null)}>
                     <div className="p-6 bg-surface-container dark:bg-surface-dark-container rounded-[28px]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-surface-on dark:text-surface-on-dark">{modalInfo.title}</h2>
                                <p className="text-3xl font-normal text-primary dark:text-primary-dark mt-1">{modalInfo.value}</p>
                            </div>
                             <button onClick={() => setModalInfo(null)} className="p-1 rounded-full hover:bg-surface-variant/20"><XMarkIcon className="w-6 h-6 text-surface-on-variant dark:text-surface-on-variant-dark"/></button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm leading-relaxed">{modalInfo.description}</p>
                            <div className="p-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl">
                                <p className="text-xs font-mono text-surface-on dark:text-surface-on-dark opacity-70 mb-1">Calculation</p>
                                <p className="text-sm font-medium text-surface-on dark:text-surface-on-dark break-all">{modalInfo.calculation.values}</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 border border-surface-outline/10 dark:border-surface-outline-dark/10 rounded-xl">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    modalInfo.analysis.rating === 'good' ? 'bg-green-500' : 
                                    modalInfo.analysis.rating === 'warning' ? 'bg-red-500' : 'bg-yellow-500'
                                }`}></div>
                                <p className="text-sm text-surface-on dark:text-surface-on-dark">{modalInfo.analysis.text}</p>
                            </div>
                        </div>
                     </div>
                </Modal>
            )}
        </div>
    );
};

export default Reports;
