
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import { DailyRecord, ExpenseCategory, ExpenseItem } from '../types';
import { generateNewRecordExpenses } from '../constants';
import { getTodayDateString } from '../utils/record-utils';
import { ChevronDownIcon, CheckIcon, TrashIcon, PlusIcon, SearchIcon, XMarkIcon } from './Icons';
import ImageUpload from './ImageUpload';

const RecordForm: React.FC = () => {
    const { recordId } = useParams();
    const navigate = useNavigate();
    const { 
        records, 
        customStructure, 
        billUploadCategories, 
        handleSave, 
        handleDelete,
        handleSaveCustomItem
    } = useAppContext();

    const isEditMode = !!recordId;
    
    // Form State
    const [date, setDate] = useState(getTodayDateString());
    const [morningSales, setMorningSales] = useState<string>('');
    const [totalSales, setTotalSales] = useState<string>('');
    const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Status State: 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
    const [status, setStatus] = useState<'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'>('IN_PROGRESS');
    
    // UI State
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Item Input State
    const [newItemInputs, setNewItemInputs] = useState<{ [categoryId: string]: string }>({});
    const [saveToPermanent, setSaveToPermanent] = useState<{ [categoryId: string]: boolean }>({});

    // Initialize Data
    useEffect(() => {
        if (isEditMode && recordId) {
            const record = records.find(r => r.id === recordId);
            if (record) {
                setDate(record.date);
                setMorningSales(record.morningSales ? record.morningSales.toString() : '');
                setTotalSales(record.totalSales.toString());
                setExpenses(JSON.parse(JSON.stringify(record.expenses))); // Deep copy
                
                // Set Status
                if (record.isClosed) {
                    setStatus('CLOSED');
                } else if (record.isCompleted === false) {
                    // Only set IN_PROGRESS if explicitly false. 
                    // Legacy records (undefined) should default to COMPLETED.
                    setStatus('IN_PROGRESS');
                } else {
                    setStatus('COMPLETED');
                }
                
                // Auto-expand categories with values
                const activeCats = record.expenses
                    .filter(c => c.items.some(i => i.amount > 0))
                    .map(c => c.name);
                setExpandedCategories(activeCats);
            } else {
                alert('Record not found');
                navigate('/records');
            }
        } else {
            // New Record
            setExpenses(generateNewRecordExpenses(customStructure));
            setExpandedCategories(Object.keys(customStructure));
            setStatus('IN_PROGRESS'); // Default for new records
        }
    }, [isEditMode, recordId, records, customStructure, navigate]);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev => 
            prev.includes(categoryName) 
                ? prev.filter(c => c !== categoryName) 
                : [...prev, categoryName]
        );
    };

    const handleExpenseChange = (categoryId: string, itemId: string, amount: string) => {
        setExpenses(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: cat.items.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, amount: amount === '' ? 0 : parseFloat(amount) };
                })
            };
        }));
    };

    const handlePhotosChange = (categoryId: string, itemId: string, photos: string[]) => {
         setExpenses(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: cat.items.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, billPhotos: photos };
                })
            };
        }));
    };

    const handleAddItem = async (categoryId: string, categoryName: string) => {
        const name = newItemInputs[categoryId]?.trim();
        if (!name) return;

        // Check for duplicates in current list
        const category = expenses.find(c => c.id === categoryId);
        if (category && category.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            alert('Item already exists in this category.');
            return;
        }

        const newItem: ExpenseItem = {
            id: uuidv4(),
            name: name,
            amount: 0,
            billPhotos: []
        };

        setExpenses(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            return { ...cat, items: [...cat.items, newItem] };
        }));

        if (saveToPermanent[categoryId]) {
            await handleSaveCustomItem(categoryName, name, 0);
        }

        setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
        setSaveToPermanent(prev => ({ ...prev, [categoryId]: false }));
    };

    const displayedExpenses = useMemo(() => {
        if (!searchTerm.trim()) return expenses;
        const lowerTerm = searchTerm.toLowerCase();
        
        // Filter categories and items
        return expenses.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.name.toLowerCase().includes(lowerTerm))
        })).filter(cat => cat.items.length > 0);
    }, [expenses, searchTerm]);

    const currentTotalExpenses = useMemo(() => {
        return expenses.reduce((total, cat) => 
            total + cat.items.reduce((sub, item) => sub + (item.amount || 0), 0), 0
        );
    }, [expenses]);

    const currentProfit = useMemo(() => {
        const sales = parseFloat(totalSales) || 0;
        return sales - currentTotalExpenses;
    }, [totalSales, currentTotalExpenses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!date) {
            alert('Date is required');
            return;
        }

        // Validation based on status
        if (status !== 'CLOSED' && !totalSales && status === 'COMPLETED') {
            alert('Total Sales is required to mark as Completed');
            return;
        }

        setIsSubmitting(true);

        const newRecord: DailyRecord = {
            id: isEditMode && recordId ? recordId : uuidv4(),
            date,
            morningSales: parseFloat(morningSales) || 0,
            totalSales: parseFloat(totalSales) || 0,
            expenses,
            isClosed: status === 'CLOSED',
            isCompleted: status === 'COMPLETED' || status === 'CLOSED' // Closed implies completed flow
        };

        try {
            await handleSave(newRecord, isEditMode ? recordId : undefined);
            navigate(-1);
        } catch (error) {
            console.error(error);
            alert('Failed to save record');
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteRecord = async () => {
        if (confirm('Are you sure you want to delete this record?')) {
            if (recordId) {
                await handleDelete(recordId);
                navigate('/records');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            {/* Top Stats Bar (Sticky) */}
            <div className="sticky top-[64px] z-20 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-md -mx-4 px-4 py-3 border-b border-surface-outline/10 dark:border-surface-outline-dark/10 shadow-sm flex justify-between items-center transition-all">
                <div>
                    <p className="text-[10px] uppercase font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70 tracking-wider">Net Profit</p>
                    {status === 'CLOSED' ? (
                        <span className="text-xl font-bold text-surface-on-variant dark:text-surface-on-variant-dark">Closed</span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className={`text-xl font-bold ${currentProfit >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                                {currentProfit >= 0 ? '+' : ''}₹{Math.abs(currentProfit).toLocaleString('en-IN')}
                            </p>
                            {status === 'IN_PROGRESS' && (
                                <span className="text-[10px] bg-tertiary-container dark:bg-tertiary-container-dark text-tertiary-on-container dark:text-tertiary-on-container-dark px-1.5 py-0.5 rounded font-bold">IN PROGRESS</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-surface-on-variant dark:text-surface-on-variant-dark opacity-70 tracking-wider">Expenses</p>
                    <p className="text-xl font-bold text-error dark:text-error-dark">₹{currentTotalExpenses.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Date & Status */}
            <div className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[24px] space-y-4">
                <div className="flex flex-col gap-4">
                    <div>
                         <label className="block text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark mb-1.5 ml-1">Date</label>
                         <input 
                            type="date" 
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all font-medium"
                        />
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark mb-1.5 ml-1">Daily Status</label>
                         <div className="flex bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl p-1 gap-1">
                             <button
                                type="button"
                                onClick={() => setStatus('IN_PROGRESS')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${status === 'IN_PROGRESS' ? 'bg-tertiary dark:bg-tertiary-dark text-white dark:text-tertiary-on-dark shadow-sm' : 'text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface/50'}`}
                             >
                                 In Progress
                             </button>
                             <button
                                type="button"
                                onClick={() => setStatus('COMPLETED')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${status === 'COMPLETED' ? 'bg-success dark:bg-success-dark text-white dark:text-success-on-dark shadow-sm' : 'text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface/50'}`}
                             >
                                 Completed
                             </button>
                             <button
                                type="button"
                                onClick={() => setStatus('CLOSED')}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${status === 'CLOSED' ? 'bg-error dark:bg-error-dark text-white dark:text-error-on-dark shadow-sm' : 'text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface/50'}`}
                             >
                                 Shop Closed
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Sales Section */}
            {status !== 'CLOSED' && (
                <div className="bg-surface-container dark:bg-surface-dark-container p-5 rounded-[24px] space-y-4 animate-scaleIn">
                    <h3 className="text-sm font-bold text-primary dark:text-primary-dark uppercase tracking-wider">Sales</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1 ml-1">
                                Total Sales {status === 'COMPLETED' ? '(Required)' : '(Optional)'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-on-variant dark:text-surface-on-variant-dark font-bold">₹</span>
                                <input 
                                    type="number" 
                                    inputMode="numeric"
                                    required={status === 'COMPLETED'}
                                    placeholder="0"
                                    value={totalSales}
                                    onChange={(e) => setTotalSales(e.target.value)}
                                    className="w-full bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark rounded-xl pl-8 pr-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all placeholder-surface-on-variant/30"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1 ml-1 Morning Sales (Optional)">Morning Sales (Optional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-on-variant dark:text-surface-on-variant-dark font-bold">₹</span>
                                <input 
                                    type="number" 
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={morningSales}
                                    onChange={(e) => setMorningSales(e.target.value)}
                                    className="w-full bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark rounded-xl pl-8 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all placeholder-surface-on-variant/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-surface-on-variant dark:text-surface-on-variant-dark uppercase tracking-wider">Expenses</h3>
                    <button type="button" onClick={() => setExpandedCategories([])} className="text-xs text-primary dark:text-primary-dark font-medium">Collapse All</button>
                </div>

                {/* Search Bar */}
                <div className="relative px-1">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl text-sm text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark" />
                    {searchTerm && (
                        <button 
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-surface-on-variant hover:bg-surface-variant/20"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {displayedExpenses.map((category) => {
                    const isSearching = searchTerm.trim().length > 0;
                    const isExpanded = isSearching || expandedCategories.includes(category.name);
                    const catTotal = category.items.reduce((sum, item) => sum + (item.amount || 0), 0);
                    const activeCount = category.items.filter(i => i.amount > 0).length;
                    const canUpload = billUploadCategories.includes(category.name);

                    return (
                        <div key={category.id} className="bg-surface-container dark:bg-surface-dark-container rounded-[24px] overflow-hidden transition-all duration-300">
                            <button 
                                type="button"
                                onClick={() => toggleCategory(category.name)}
                                className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-surface-container-high/50 dark:bg-surface-dark-container-high/50' : 'hover:bg-surface-container-high/30 dark:hover:bg-surface-dark-container-high/30'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary dark:text-primary-dark' : 'text-surface-on-variant dark:text-surface-on-variant-dark'}`}>
                                        <ChevronDownIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-surface-on dark:text-surface-on-dark text-sm">{category.name}</h4>
                                        {!isExpanded && activeCount > 0 && (
                                            <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5">{activeCount} items</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {catTotal > 0 && (
                                        <span className="block font-bold text-surface-on dark:text-surface-on-dark">₹{catTotal.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div className="p-3 space-y-2 animate-fadeIn">
                                    {category.items.map((item) => {
                                        const hasValue = item.amount > 0;
                                        return (
                                            <div key={item.id} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-colors ${hasValue ? 'bg-surface-container-high dark:bg-surface-dark-container-high border-transparent' : 'bg-transparent border-surface-outline/10 dark:border-surface-outline-dark/10'}`}>
                                                
                                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                                    <label htmlFor={`${category.id}-${item.id}`} className="text-sm font-medium text-surface-on dark:text-surface-on-dark cursor-pointer select-none break-words leading-tight">
                                                        {item.name}
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {canUpload && (
                                                        <ImageUpload 
                                                            billPhotos={item.billPhotos}
                                                            onPhotosChange={(photos) => handlePhotosChange(category.id, item.id, photos)}
                                                        />
                                                    )}
                                                    
                                                    <div className="relative w-24">
                                                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors ${hasValue ? 'text-surface-on dark:text-surface-on-dark' : 'text-surface-on-variant/50 dark:text-surface-on-variant-dark/50'}`}>₹</span>
                                                        <input
                                                            id={`${category.id}-${item.id}`}
                                                            type="number"
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={item.amount || ''}
                                                            onChange={(e) => handleExpenseChange(category.id, item.id, e.target.value)}
                                                            className={`w-full pl-6 pr-3 py-2.5 rounded-xl text-right text-sm font-bold outline-none transition-all ${
                                                                hasValue 
                                                                ? 'bg-surface dark:bg-surface-dark text-surface-on dark:text-surface-on-dark shadow-sm' 
                                                                : 'bg-surface-container-highest/50 dark:bg-surface-dark-container-highest/50 text-surface-on dark:text-surface-on-dark focus:bg-surface dark:focus:bg-surface-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Polished Add New Item Section - Hidden during search */}
                                    {!isSearching && (
                                        <div className="mt-4 pt-4 border-t border-dashed border-surface-outline/20 dark:border-surface-outline-dark/20">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative flex-grow">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add custom item..." 
                                                            value={newItemInputs[category.id] || ''}
                                                            onChange={(e) => setNewItemInputs(prev => ({...prev, [category.id]: e.target.value}))}
                                                            className="w-full bg-surface-container-highest/30 dark:bg-surface-dark-container-highest/30 rounded-xl pl-3 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 transition-all placeholder-surface-on-variant/40 text-surface-on dark:text-surface-on-dark"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddItem(category.id, category.name);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleAddItem(category.id, category.name)}
                                                        disabled={!newItemInputs[category.id]?.trim()}
                                                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary dark:bg-primary-dark text-white dark:text-primary-on-dark rounded-xl disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-surface-on-variant/50 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <PlusIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                
                                                {/* Save to Permanent Option - Animated */}
                                                <div className={`flex items-center gap-2 px-1 transition-all duration-300 overflow-hidden ${newItemInputs[category.id]?.trim() ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                        <div className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer" 
                                                                checked={saveToPermanent[category.id] || false}
                                                                onChange={(e) => setSaveToPermanent(prev => ({...prev, [category.id]: e.target.checked}))}
                                                            />
                                                            <div className="w-9 h-5 bg-surface-variant dark:bg-surface-dark-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary-dark/20 rounded-full peer dark:bg-surface-dark-container-highest peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary-dark"></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                                                            Save to permanent list
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="pt-4 pb-10 flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-[20px] font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <CheckIcon className="w-6 h-6" />
                            {isEditMode ? 'Update Record' : 'Save Record'}
                        </>
                    )}
                </button>
                
                {isEditMode && (
                    <button
                        type="button"
                        onClick={handleDeleteRecord}
                        className="w-full py-3.5 bg-error-container dark:bg-error-container-dark text-error-on-container dark:text-error-on-container-dark rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Delete Record
                    </button>
                )}
            </div>
        </form>
    );
};

export default RecordForm;
