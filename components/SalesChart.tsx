import React, { useState } from 'react';

interface SalesChartDataPoint {
    date: string;
    morningSales: number;
    nightSales: number;
    totalSales: number;
}

interface SalesChartProps {
    data: SalesChartDataPoint[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: SalesChartDataPoint | null }>({ visible: false, x: 0, y: 0, data: null });

    const width = 500;
    const height = 200;
    const margin = { top: 20, right: 0, bottom: 40, left: 0 };
    
    if(!data || data.length === 0) return <div className="text-center text-slate-500 dark:text-slate-400 py-10">Not enough data to display chart.</div>;

    const maxTotalSales = Math.max(...data.map(d => d.totalSales), 1);
    
    const barWidth = (width - margin.left - margin.right) / data.length * 0.8;
    const barMargin = (width - margin.left - margin.right) / data.length * 0.2;

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>, point: SalesChartDataPoint) => {
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
                {data.map((d, i) => {
                    const totalBarHeight = d.totalSales / maxTotalSales * (height - margin.top - margin.bottom);
                    const morningBarHeight = d.morningSales / maxTotalSales * (height - margin.top - margin.bottom);
                    const nightBarHeight = d.nightSales / maxTotalSales * (height - margin.top - margin.bottom);
                    
                    const x = margin.left + i * (barWidth + barMargin);
                    const yTotal = height - margin.bottom - totalBarHeight;
                    const yNight = height - margin.bottom - nightBarHeight;
                    const yMorning = height - margin.bottom - morningBarHeight;

                    const showLabel = data.length <= 15 || i % 3 === 0;

                    return (
                        <g key={d.date}>
                             {/* Morning Sales Bar */}
                            <rect
                                x={x}
                                y={height - margin.bottom - morningBarHeight}
                                width={barWidth}
                                height={morningBarHeight}
                                className="fill-secondary/60"
                            />
                            {/* Night Sales Bar (stacked on top) */}
                            <rect
                                x={x}
                                y={height - margin.bottom - morningBarHeight - nightBarHeight}
                                width={barWidth}
                                height={nightBarHeight}
                                className="fill-primary/60"
                            />
                            {/* Invisible rect for tooltip handling */}
                            <rect
                                x={x}
                                y={yTotal}
                                width={barWidth}
                                height={totalBarHeight}
                                className="fill-transparent cursor-pointer"
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
             <div className="absolute top-0 right-0 flex space-x-3 text-xs">
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-secondary/60 mr-1.5"></span>
                    <span className="text-slate-600 dark:text-slate-400">Morning</span>
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-primary/60 mr-1.5"></span>
                    <span className="text-slate-600 dark:text-slate-400">Night</span>
                </div>
            </div>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="absolute bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-lg py-2 px-3 shadow-lg pointer-events-none transition-opacity duration-200 border border-slate-200 dark:border-slate-700"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}
                >
                    <p className="font-bold text-sm mb-1">{new Date(tooltip.data.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                    <p className="font-semibold mb-1 text-base text-primary">
                        ₹{tooltip.data.totalSales.toLocaleString('en-IN')}
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Total Sales</span>
                    </p>
                    <div className="text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5 space-y-1">
                      <p className="flex justify-between items-center"><span className="font-medium">Morning:</span> <span className="font-mono ml-2">₹{tooltip.data.morningSales.toLocaleString('en-IN')}</span></p>
                      <p className="flex justify-between items-center"><span className="font-medium">Night:</span> <span className="font-mono ml-2">₹{tooltip.data.nightSales.toLocaleString('en-IN')}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesChart;