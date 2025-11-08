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
    const margin = { top: 20, right: 0, bottom: 20, left: 0 };
    
    if(!data || data.length === 0) return <div className="text-center text-gray-500">Not enough data to display chart.</div>;

    const maxProfit = Math.max(...data.map(d => d.profit), 0);
    const minProfit = Math.min(...data.map(d => d.profit), 0);
    
    const yRange = maxProfit - minProfit;
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
        <div className="relative w-full h-64">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Zero line */}
                {hasZeroLine && (
                    <line x1={margin.left} y1={zeroLineY} x2={width - margin.right} y2={zeroLineY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" />
                )}
                
                {data.map((d, i) => {
                    const barHeight = Math.abs(d.profit) / yRange * (height - margin.top - margin.bottom);
                    const x = margin.left + i * (barWidth + barMargin);
                    const y = d.profit >= 0 ? zeroLineY - barHeight : zeroLineY;

                    return (
                        <rect
                            key={d.date}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={d.profit >= 0 ? '#34d399' : '#f87171'}
                            className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                            onMouseMove={(e) => handleMouseMove(e, d)}
                            onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                        />
                    );
                })}
            </svg>
            {tooltip.visible && tooltip.data && (
                <div 
                    className="absolute bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg pointer-events-none"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 40, transform: 'translateX(-50%)' }}
                >
                    <p className="font-bold">{new Date(tooltip.data.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                    <p>Profit: ₹{tooltip.data.profit.toLocaleString()}</p>
                    <p className="text-gray-300">Sales: ₹{tooltip.data.sales.toLocaleString()}</p>
                    <p className="text-gray-300">Expenses: ₹{tooltip.data.expenses.toLocaleString()}</p>
                </div>
            )}
        </div>
    );
};

export default Chart;