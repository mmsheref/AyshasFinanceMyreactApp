import React, { useState, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from './Icons';

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: { startDate: string; endDate: string }) => void;
  initialRange: { startDate: string; endDate: string };
}

// Memoized DayButton component to prevent unnecessary re-renders
const DayButton = React.memo(({ day, className, onClick }: { day: Date; className: string; onClick: () => void; }) => {
    return (
        <button onClick={onClick} className={className}>
            {day.getDate()}
        </button>
    );
});


const DateRangePicker: React.FC<DateRangePickerProps> = ({ isOpen, onClose, onApply, initialRange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialRange.startDate ? new Date(initialRange.startDate + 'T00:00:00') : null);
  const [endDate, setEndDate] = useState<Date | null>(initialRange.endDate ? new Date(initialRange.endDate + 'T00:00:00') : null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const days = [];
    while (date.getMonth() === currentMonth.getMonth()) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    const dayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    return dayIndex;
  }, [currentMonth]);

  const handleDayClick = useCallback((day: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day < startDate) {
        setEndDate(startDate);
        setStartDate(day);
      } else {
        setEndDate(day);
      }
    }
  }, [startDate, endDate]);
  
  const changeMonth = (offset: number) => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleApplyClick = () => {
    onApply({
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : (startDate ? startDate.toISOString().split('T')[0] : ''),
    });
    onClose();
  };

  const getDayClass = (day: Date) => {
    const classes = ['w-10 h-10 flex items-center justify-center rounded-full transition-colors text-sm'];
    const time = day.getTime();
    const isToday = day.toDateString() === new Date().toDateString();

    if (isToday) {
        classes.push('font-bold');
    }

    if (!startDate) {
        return `${classes.join(' ')} hover:bg-slate-200 dark:hover:bg-slate-700`;
    }

    const startTime = startDate.getTime();
    const effectiveEndDate = endDate || hoverDate;
    
    if (!effectiveEndDate || !endDate && time === startTime) {
      if (time === startTime) {
        classes.push('bg-primary text-white font-semibold');
      } else {
        classes.push('hover:bg-slate-200 dark:hover:bg-slate-700');
      }
      return classes.join(' ');
    }
    
    const endTime = effectiveEndDate.getTime();
    const rangeStart = Math.min(startTime, endTime);
    const rangeEnd = Math.max(startTime, endTime);
    
    if (time === startTime) {
        classes.push('bg-primary text-white font-semibold rounded-r-none');
    } else if (time === endTime && endDate) { // Only style end date if it's permanent
        classes.push('bg-primary text-white font-semibold rounded-l-none');
    } else if (time > rangeStart && time < rangeEnd) {
        classes.push('bg-primary/20 dark:bg-primary/30 rounded-none');
        if (day.getDay() === 0) classes.push('rounded-l-full');
        if (day.getDay() === 6) classes.push('rounded-r-full');
    } else {
        classes.push('hover:bg-slate-200 dark:hover:bg-slate-700');
    }
    
    return classes.join(' ');
  };
  
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Select Date Range</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
            <XMarkIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <div className="flex-grow p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeftIcon className="w-5 h-5" /></button>
                <p className="font-semibold text-lg">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
             <div 
                className="grid grid-cols-7 gap-y-1"
                onMouseLeave={() => setHoverDate(null)}
            >
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysInMonth.map(day => (
                    <div 
                        key={day.toISOString()} 
                        className="flex justify-center"
                        onMouseEnter={() => !endDate && setHoverDate(day)}
                    >
                        <DayButton
                            day={day}
                            onClick={() => handleDayClick(day)}
                            className={getDayClass(day)}
                         />
                    </div>
                ))}
             </div>
        </div>
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3">
             <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
             <button onClick={handleApplyClick} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Apply</button>
        </div>
      </div>
    </Modal>
  );
};

export default DateRangePicker;
