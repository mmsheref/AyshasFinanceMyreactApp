
import React from 'react';
import { DailyRecord, ExpenseCategory } from '../types';

interface ShareableReportProps {
  record: DailyRecord;
  id: string; // To target with html2canvas
}

const calculateTotalExpenses = (record: DailyRecord) => {
    return record.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
};

// Colors hardcoded to match the App's Light Theme (Material 3)
const COLORS = {
    surface: '#FEF7FF',           
    surfaceContainer: '#F3EDF7',  
    surfaceContainerHigh: '#ECE6F0', 
    onSurface: '#1D1B20',         
    onSurfaceVariant: '#49454F',  
    primary: '#6750A4',           
    primaryContainer: '#EADDFF',  
    onPrimaryContainer: '#21005D', 
    error: '#B3261E',             
    success: '#006C4C',           
    outline: '#79747E',           
};

// Helper for card styling
const cardStyle = {
    backgroundColor: COLORS.surface,
    borderRadius: '24px',
    padding: '24px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const CategoryCard: React.FC<{ category: ExpenseCategory }> = ({ category }) => {
    const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
    const itemsWithAmount = category.items.filter(item => item.amount > 0);

    if (itemsWithAmount.length === 0) return null;

    return (
        <div style={{ 
            marginBottom: '20px', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: `1px solid ${COLORS.outline}20`,
            backgroundColor: 'white'
        }}>
            <h4 style={{ 
                padding: '12px 16px', 
                backgroundColor: `${COLORS.primary}15`, 
                color: COLORS.primary,
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>{category.name}</span>
                <span>₹{categoryTotal.toLocaleString('en-IN')}</span>
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {itemsWithAmount.map((item, index) => (
                    <li key={item.id} style={{ 
                        padding: '10px 16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '13px',
                        borderBottom: index < itemsWithAmount.length - 1 ? `1px solid ${COLORS.outline}10` : 'none',
                        color: COLORS.onSurface
                    }}>
                        <span>{item.name}</span>
                        <span style={{ fontWeight: 600 }}>₹{item.amount.toLocaleString('en-IN')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ShareableReport: React.FC<ShareableReportProps> = ({ record, id }) => {
  const totalExpenses = calculateTotalExpenses(record);
  const profit = record.totalSales - totalExpenses;
  const morningSales = record.morningSales || 0;
  const nightSales = record.totalSales - morningSales;
  
  const categoriesWithExpenses = record.expenses.filter(category => 
    category.items.reduce((sum, item) => sum + item.amount, 0) > 0
  );

  // Split categories into two columns for layout balance
  const midPoint = Math.ceil(categoriesWithExpenses.length / 2);
  const leftColumn = categoriesWithExpenses.slice(0, midPoint);
  const rightColumn = categoriesWithExpenses.slice(midPoint);
  
  return (
    <div id={id} style={{ 
        width: '800px', 
        backgroundColor: COLORS.surfaceContainer, 
        color: COLORS.onSurface, 
        fontFamily: 'Roboto, sans-serif',
        padding: '40px',
        boxSizing: 'border-box'
    }}>
      
      {/* Header Section */}
      <div style={{ 
          textAlign: 'center', 
          paddingBottom: '24px', 
          marginBottom: '32px', 
          borderBottom: `1px solid ${COLORS.outline}30` 
      }}>
        <p style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.2em', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            color: COLORS.onSurfaceVariant 
        }}>Daily P&L Report</p>
        <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: COLORS.onSurface,
            margin: 0
        }}>
            {new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h1>
        {record.isClosed && (
             <span style={{ 
                 display: 'inline-block', 
                 marginTop: '12px', 
                 padding: '4px 12px', 
                 borderRadius: '999px', 
                 fontSize: '12px', 
                 fontWeight: 'bold', 
                 textTransform: 'uppercase', 
                 letterSpacing: '0.05em', 
                 backgroundColor: COLORS.surfaceContainerHigh, 
                 color: COLORS.onSurfaceVariant, 
                 border: `1px solid ${COLORS.outline}40` 
             }}>
                 Shop Closed
             </span>
        )}
      </div>

      {/* KPI Cards Row (Flexbox) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
        
        {/* Sales Card */}
        <div style={{ ...cardStyle, justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', color: COLORS.onSurfaceVariant }}>Total Sales</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.primary, margin: 0 }}>₹{record.totalSales.toLocaleString('en-IN')}</p>
            </div>
             {!record.isClosed && (
             <div style={{ fontSize: '11px', borderTop: `1px solid ${COLORS.outline}20`, paddingTop: '10px', marginTop: '10px', color: COLORS.onSurfaceVariant }}>
                <p style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 4px 0' }}>
                    <span>Morning:</span> <span style={{ fontWeight: 'bold', color: COLORS.onSurface }}>₹{morningSales.toLocaleString('en-IN')}</span>
                </p>
                <p style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}>
                    <span>Night:</span> <span style={{ fontWeight: 'bold', color: COLORS.onSurface }}>₹{nightSales.toLocaleString('en-IN')}</span>
                </p>
            </div>
             )}
        </div>
        
        {/* Expenses Card */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', color: COLORS.onSurfaceVariant }}>Total Expenses</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.error, margin: 0 }}>₹{totalExpenses.toLocaleString('en-IN')}</p>
        </div>

        {/* Profit Card */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', color: COLORS.onSurfaceVariant }}>{profit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: profit >= 0 ? COLORS.success : COLORS.error, margin: 0 }}>
            {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.onSurface, margin: 0, paddingRight: '10px' }}>Expense Breakdown</h3>
            <div style={{ flexGrow: 1, height: '1px', backgroundColor: `${COLORS.outline}30` }}></div>
        </div>
        
        {/* Two Column Layout using Flexbox */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Left Column */}
            <div style={{ flex: 1 }}>
                {leftColumn.map(category => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </div>
            
            {/* Right Column */}
            <div style={{ flex: 1 }}>
                {rightColumn.map(category => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </div>
        </div>
      </div>

       <div style={{ 
           textAlign: 'center', 
           marginTop: '40px', 
           paddingTop: '20px', 
           borderTop: `1px solid ${COLORS.outline}30`, 
           fontSize: '12px', 
           fontWeight: 500, 
           color: COLORS.onSurfaceVariant 
       }}>
        <p style={{ margin: 0 }}>Generated by Ayshas Finance Tracker</p>
      </div>
    </div>
  );
};

export default ShareableReport;
