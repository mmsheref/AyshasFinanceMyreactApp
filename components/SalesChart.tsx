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
    
    if(!data || data.length === 0) return <div className="text-center text-surface-on-variant dark:text-surface-on-variant-dark py-10">Not enough data to display chart.</div>;

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
                    
                    const showLabel = data.length <= 15 || i % 3 === 0;

                    return (
                        <g key={d.date}>
                             {/* Morning Sales Bar (Bottom) - Using Tertiary color for contrast */}
                            <rect
                                x={x}
                                y={height - margin.bottom - morningBarHeight}
                                width={barWidth}
                                height={morningBarHeight}
                                className="fill-tertiary dark:fill-tertiary-dark"
                            />
                            {/* Night Sales Bar (stacked on top) - Using Primary color */}
                            <rect
                                x={x}
                                y={height - margin.bottom - morningBarHeight - nightBarHeight}
                                width={barWidth}
                                height={nightBarHeight}
                                className="fill-primary dark:fill-primary-dark"
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
                                    className="text-[10px] select-none fill-current text-surface-on-variant dark:text-surface-on-variant-dark"
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
                    <span className="w-3 h-3 rounded-full bg-tertiary dark:bg-tertiary-dark mr-1.5"></span>
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Morning</span>
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-primary dark:bg-primary-dark mr-1.5"></span>
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark">Night</span>
                </div>
            </div>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="absolute bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark text-xs rounded-lg py-2 px-3 shadow-elevation-2 pointer-events-none transition-opacity duration-200 border border-surface-outline/10 dark:border-surface-outline-dark/10"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -110%)' }}
                >
                    <p className="font-bold text-sm mb-1">{new Date(tooltip.data.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                    <p className="font-semibold mb-1 text-base text-primary dark:text-primary-dark">
                        ₹{tooltip.data.totalSales.toLocaleString('en-IN')}
                        <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark ml-1 font-normal">Total Sales</span>
                    </p>
                    <div className="text-surface-on-variant dark:text-surface-on-variant-dark border-t border-surface-outline/10 dark:border-surface-outline-dark/10 pt-1.5 mt-1.5 space-y-1">
                      <p className="flex justify-between items-center"><span className="font-medium">Morning:</span> <span className="font-mono ml-2 text-surface-on dark:text-surface-on-dark">₹{tooltip.data.morningSales.toLocaleString('en-IN')}</span></p>
                      <p className="flex justify-between items-center"><span className="font-medium">Night:</span> <span className="font-mono ml-2 text-surface-on dark:text-surface-on-dark">₹{tooltip.data.nightSales.toLocaleString('en-IN')}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesChart;