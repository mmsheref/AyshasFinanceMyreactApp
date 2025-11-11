import React, { useState } from 'react';

interface ChartDataPoint {
    date: string;
    profit: number;
    sales: number;
    expenses: number;
}

interface ChartProps {
    data: ChartDataPoint[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: ChartDataPoint | null }>({ visible: false, x: 0, y: 0, data: null });

    const width = 500;
    const height = 200;
    const margin = { top: 20, right: 0, bottom: 40, left: 0 };
    
    if(!data || data.length === 0) return <div className="text-center text-slate-500 dark:text-slate-400 py-10">Not enough data to display chart.</div>;

    const maxProfit = Math.max(...data.map(d => d.profit), 0);
    const minProfit = Math.min(...data.map(d => d.profit), 0);
    
    const yRange = (maxProfit - minProfit) === 0 ? 1 : (maxProfit - minProfit); // Avoid division by zero
    const hasZeroLine = minProfit < 0 && maxProfit > 0;
    const zeroLineY = hasZeroLine ? (maxProfit / yRange) * (height - margin.top - margin.bottom) + margin.top : height - margin.bottom;

    const barWidth = (width - margin.left - margin.right) / data.length * 0.8;
    const barMargin = (width - margin.left - margin.right) / data.length * 0.2;

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>, point: ChartDataPoint) => {
        const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
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
        <div className="relative w-full h-52">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Zero line */}
                {hasZeroLine && (
                    <line x1={margin.left} y1={zeroLineY} x2={width - margin.right} y2={zeroLineY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" strokeDasharray="2,2" />
                )}
                
                {data.map((d, i) => {
                    const barHeight = Math.abs(d.profit) / yRange * (height - margin.top - margin.bottom);
                    const x = margin.left + i * (barWidth + barMargin);
                    const y = d.profit >= 0 ? zeroLineY - barHeight : zeroLineY;

                    const showLabel = data.length <= 15 || i % 3 === 0;

                    return (
                        <g key={d.date}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                className={`cursor-pointer transition-opacity ${d.profit >= 0 ? 'fill-success/70 hover:fill-success' : 'fill-error/70 hover:fill-error'}`}
                                onMouseMove={(e) => handleMouseMove(e, d)}
                                onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                            />
                            {showLabel && (
                                <text
                                    x={x + barWidth / 2}
                                    y={height - margin.bottom + 15}
                                    textAnchor="middle"
                                    className="text-[10px] select-none fill-current text-slate-500 dark:text-slate-400"
                                >
                                    <tspan>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</tspan>
                                    <tspan x={x + barWidth / 2} dy="1.2em">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })}</tspan>
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="absolute bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-lg py-2 px-3 shadow-lg pointer-events-none transition-opacity duration-200 border border-slate-200 dark:border-slate-700"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}
                >
                    <p className="font-bold text-sm mb-1">{new Date(tooltip.data.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                    <p className={`font-semibold mb-1 text-base ${tooltip.data.profit >= 0 ? 'text-success' : 'text-error'}`}>
                        ₹{tooltip.data.profit.toLocaleString('en-IN')}
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Profit</span>
                    </p>
                    <div className="text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5 space-y-1">
                      <p className="flex justify-between items-center"><span className="font-medium">Sales:</span> <span className="font-mono ml-2">₹{tooltip.data.sales.toLocaleString('en-IN')}</span></p>
                      <p className="flex justify-between items-center"><span className="font-medium">Expenses:</span> <span className="font-mono ml-2">₹{tooltip.data.expenses.toLocaleString('en-IN')}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chart;