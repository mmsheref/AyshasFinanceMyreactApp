import React, { useState } from 'react';

interface ExpenseProfitDataPoint {
    date: string;
    sales: number;
    expenses: number;
    profit: number;
}

interface ExpenseProfitChartProps {
    data: ExpenseProfitDataPoint[];
}

const ExpenseProfitChart: React.FC<ExpenseProfitChartProps> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: ExpenseProfitDataPoint | null }>({ visible: false, x: 0, y: 0, data: null });

    const width = 500;
    const height = 240;
    const margin = { top: 30, right: 10, bottom: 40, left: 10 };
    
    if(!data || data.length === 0) return <div className="text-center text-surface-on-variant dark:text-surface-on-variant-dark py-10">Not enough data to display chart.</div>;

    // Calculate scaling domains
    const maxVal = Math.max(
        ...data.map(d => d.sales),
        ...data.map(d => d.expenses), 
        ...data.map(d => d.profit),
        0
    );
    // Min value is typically 0, unless there's a significant loss
    const minVal = Math.min(
        ...data.map(d => d.profit), 
        0
    );

    const yRange = (maxVal - minVal) === 0 ? 1 : (maxVal - minVal);
    const availableHeight = height - margin.top - margin.bottom;
    
    // Y-coordinate generator
    const getY = (val: number) => {
        const normalizedVal = val - minVal;
        return height - margin.bottom - (normalizedVal / yRange) * availableHeight;
    };

    const zeroLineY = getY(0);

    // Layout calculations
    const groupWidth = (width - margin.left - margin.right) / data.length;
    const padding = groupWidth * 0.25; 
    const availableBarSpace = groupWidth - padding;
    const barWidth = availableBarSpace / 2; 

    // Helper for Profit Line Points
    const getGroupCenterX = (i: number) => margin.left + i * groupWidth + groupWidth / 2;
    
    const profitPoints = data.map((d, i) => `${getGroupCenterX(i)},${getY(d.profit)}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement | SVGRectElement>, point: ExpenseProfitDataPoint) => {
        const svgRect = e.currentTarget.ownerSVGElement ? e.currentTarget.ownerSVGElement.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
        if (svgRect) {
            setTooltip({
                visible: true,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top,
                data: point
            });
        }
    };

    return (
        <div className="relative w-full h-60">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}>
                {/* Zero line */}
                <line 
                    x1={margin.left} 
                    y1={zeroLineY} 
                    x2={width - margin.right} 
                    y2={zeroLineY} 
                    stroke="currentColor" 
                    className="text-surface-outline dark:text-surface-outline-dark opacity-30" 
                    strokeWidth="1" 
                />
                
                {data.map((d, i) => {
                    const xGroupStart = margin.left + i * groupWidth + padding / 2;
                    const xSales = xGroupStart;
                    const xExpenses = xGroupStart + barWidth;
                    
                    // Sales Bar (From 0 up)
                    const salesHeight = Math.abs(getY(d.sales) - zeroLineY);
                    const salesY = getY(d.sales);

                    // Expense Bar (From 0 up)
                    const expenseHeight = Math.abs(getY(d.expenses) - zeroLineY);
                    const expenseY = getY(d.expenses);

                    const showLabel = data.length <= 15 || i % 3 === 0;

                    return (
                        <g key={d.date}>
                            {/* Sales Bar */}
                            <rect
                                x={xSales}
                                y={salesY}
                                width={barWidth}
                                height={salesHeight}
                                rx={2}
                                className="fill-primary dark:fill-primary-dark transition-opacity hover:opacity-80"
                            />
                            
                            {/* Expense Bar */}
                            <rect
                                x={xExpenses}
                                y={expenseY}
                                width={barWidth}
                                height={expenseHeight}
                                rx={2}
                                className="fill-secondary dark:fill-secondary-dark transition-opacity hover:opacity-80 opacity-70"
                            />

                            {/* Interaction Area (Invisible) */}
                            <rect
                                x={margin.left + i * groupWidth}
                                y={0}
                                width={groupWidth}
                                height={height}
                                fill="transparent"
                                onMouseMove={(e) => handleMouseMove(e, d)}
                            />

                            {showLabel && (
                                <text
                                    x={getGroupCenterX(i)}
                                    y={height - margin.bottom + 15}
                                    textAnchor="middle"
                                    className="text-[9px] select-none fill-current text-surface-on-variant dark:text-surface-on-variant-dark"
                                >
                                    <tspan>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</tspan>
                                    <tspan x={getGroupCenterX(i)} dy="1.1em">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })}</tspan>
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Profit Line Layer */}
                <path
                    d={`M ${profitPoints}`}
                    fill="none"
                    stroke="currentColor"
                    className="text-surface-on dark:text-surface-on-dark opacity-50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                />

                {/* Profit Dots */}
                {data.map((d, i) => (
                     <circle
                        key={`dot-${i}`}
                        cx={getGroupCenterX(i)}
                        cy={getY(d.profit)}
                        r={3}
                        className={`${d.profit >= 0 ? 'fill-success dark:fill-success-dark' : 'fill-error dark:fill-error-dark'} stroke-surface dark:stroke-surface-dark stroke-2`}
                        style={{ pointerEvents: 'none' }}
                     />
                ))}
            </svg>
            
            {/* Legend */}
            <div className="absolute top-0 right-0 flex space-x-3 text-xs bg-surface/50 dark:bg-surface-dark/50 backdrop-blur-sm rounded-lg p-1">
                <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary dark:bg-primary-dark mr-1.5"></span>
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Sales</span>
                </div>
                <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-sm bg-secondary dark:bg-secondary-dark opacity-70 mr-1.5"></span>
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Expenses</span>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center justify-center mr-1.5 w-3">
                         <div className="w-full h-0.5 bg-surface-on dark:bg-surface-on-dark opacity-50 relative">
                             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-success dark:bg-success-dark"></div>
                         </div>
                    </div>
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Profit</span>
                </div>
            </div>

            {tooltip.visible && tooltip.data && (
                <div 
                    className="absolute bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark text-xs rounded-lg py-2 px-3 shadow-elevation-2 pointer-events-none transition-opacity duration-200 border border-surface-outline/10 dark:border-surface-outline-dark/10 z-20"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}
                >
                    <p className="font-bold text-sm mb-1">{new Date(tooltip.data.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                    <div className="space-y-1 min-w-[120px]">
                        <p className="flex justify-between items-center gap-3">
                            <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Sales:</span>
                            <span className="font-mono text-primary dark:text-primary-dark font-semibold">₹{tooltip.data.sales.toLocaleString('en-IN')}</span>
                        </p>
                        <p className="flex justify-between items-center gap-3">
                            <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Expenses:</span>
                            <span className="font-mono text-secondary dark:text-secondary-dark font-semibold">₹{tooltip.data.expenses.toLocaleString('en-IN')}</span>
                        </p>
                         <div className="h-px bg-surface-outline/10 dark:bg-surface-outline-dark/10 my-1"></div>
                        <p className="flex justify-between items-center gap-3">
                            <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Profit:</span>
                            <span className={`font-mono font-semibold ${tooltip.data.profit >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                                {tooltip.data.profit >= 0 ? '+' : ''}₹{tooltip.data.profit.toLocaleString('en-IN')}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseProfitChart;