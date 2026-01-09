
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DailyRecord } from '../types';
import { generateNewRecordExpenses } from '../constants';
import { useAppContext } from '../context/AppContext';
import { safeFloat } from '../utils/record-utils';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ChevronDownIcon, WarningIcon, SearchIcon, ChevronRightIcon } from './Icons';

interface OutlinedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    prefix?: boolean;
    parentBg?: string;
}

// Material Outlined Input Component (Used for Sales Inputs)
const OutlinedInput: React.FC<OutlinedInputProps> = ({ 
    label, 
    id, 
    value, 
    onChange, 
    type = "text", 
    inputMode = "text", 
    placeholder = "", 
    prefix, 
    parentBg = "bg-surface-container", 
    className,
    ...props 
}) => {
    const labelBgClass = parentBg === "bg-surface-container" 
      ? "bg-surface-container dark:bg-surface-dark-container" 
      : parentBg;

    return (
    <div className={`relative group ${className || ''}`}>
        <input
            type={type}
            id={id}
            name={id}
            inputMode={inputMode}
            value={value}
            onChange={onChange}
            placeholder=" " 
            className={`block px-4 pb-2.5 pt-4 w-full text-base text-surface-on dark:text-surface-on-dark bg-transparent rounded-lg border border-surface-outline/50 dark:border-surface-outline-dark/50 appearance-none focus:outline-none focus:ring-0 focus:border-primary dark:focus:border-primary-dark peer ${prefix ? 'pl-7' : ''}`}
            {...props}
        />
        {prefix && <span className="absolute top-4 left-3 text-surface-on-variant dark:text-surface-on-variant-dark">₹</span>}
        <label
            htmlFor={id}
            className={`absolute text-base text-surface-on-variant dark:text-surface-on-variant-dark duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] ${labelBgClass} px-2 peer-focus:px-2 peer-focus:text-primary dark:peer-focus:text-primary-dark peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 ${prefix ? 'peer-focus:left-1 peer-placeholder-shown:left-5' : ''}`}
        >
            {label}
        </label>
    </div>
)};

const Switch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void, label?: string }> = ({ checked, onChange, label }) => {
    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-primary dark:bg-primary-dark' : 'bg-surface-variant dark:bg-surface-dark-container-high'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${checked ? 'transform translate-x-5' : ''}`}></div>
            </div>
            {label && <span className="ml-3 text-sm font-medium text-surface-on dark:text-surface-on-dark">{label}</span>}
        </label>
    );
};

const RecordForm: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { 
    getRecordById, 
    handleSave, 
    customStructure, 
    handleSaveCustomItem,
    records: allRecords,
    billUploadCategories
  } = useAppContext();
  
  const isEditing = !!recordId;

  const [formData, setFormData] = useState<DailyRecord | null>(null);
  const [dateError, setDateError] = useState('');
  const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', categoryIndex: 0, saveForFuture: false, defaultValue: 0 });
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{catIndex: number, itemIndex: number, itemName: string} | null>(null);
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const footerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const isSearching = expenseSearchTerm.trim().length > 0;

  useEffect(() => {
    const initializeForm = () => {
      if (isEditing) {
        const recordToEdit = getRecordById(recordId);
        if (recordToEdit) {
          setFormData(JSON.parse(JSON.stringify(recordToEdit))); 
        } else {
          navigate('/records'); 
        }
      } else {
        // Generate new expenses based on the custom structure defaults.
        const newExpenses = generateNewRecordExpenses(customStructure);
        
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          id: today, date: today, totalSales: 0, morningSales: 0, expenses: newExpenses, isClosed: false
        });
        // Don't auto-open category on mount to keep UI clean initially
        setOpenCategory(null);
      }
    };
    initializeForm();
  }, [recordId, isEditing, getRecordById, navigate, customStructure]);

  useEffect(() => {
    if (!formData?.date) {
      setDateError('');
      return;
    }
    const dateIsTakenByAnotherRecord = allRecords.some(r => r.id === formData.date && r.id !== recordId);
    setDateError(dateIsTakenByAnotherRecord ? 'A record for this date already exists.' : '');

  }, [formData?.date, allRecords, recordId]);

  const totalExpenses = useMemo(() => {
    if (!formData) return 0;
    const total = formData.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
    return safeFloat(total);
  }, [formData?.expenses]);
  
  const profit = useMemo(() => {
    if (!formData) return 0;
    if (formData.isClosed) return -totalExpenses; 
    return safeFloat((formData.totalSales || 0) - totalExpenses);
  }, [formData?.totalSales, totalExpenses, formData?.isClosed]);

  const nightSales = useMemo(() => {
    if (!formData) return 0;
    return safeFloat((formData.totalSales || 0) - (formData.morningSales || 0));
  }, [formData?.totalSales, formData?.morningSales]);

  // Simplified this memo to prevent creating new object references constantly
  // We just return indices now, mapping handled in render
  const filteredIndices = useMemo(() => {
    if (!formData) return [];
    
    const trimmedSearch = expenseSearchTerm.trim().toLowerCase();
    
    return formData.expenses.map((category, catIndex) => {
        if (!trimmedSearch) {
            return { catIndex, itemIndices: category.items.map((_, i) => i) };
        }
        
        const matchingItemIndices = category.items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.name.toLowerCase().includes(trimmedSearch))
            .map(({ index }) => index);
            
        return { catIndex, itemIndices: matchingItemIndices };
    }).filter(group => group.itemIndices.length > 0);

  }, [formData?.expenses, expenseSearchTerm]); // Only depend on expenses structure/values and search

  if (!formData) return null; 

  const { totalSales, expenses, morningSales } = formData;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData };
    if (name === 'date') {
        updatedFormData.date = value;
        updatedFormData.id = value;
    } else {
        if (value === '') {
            (updatedFormData as any)[name] = 0;
        } else {
            const parsedValue = parseFloat(value);
            (updatedFormData as any)[name] = isNaN(parsedValue) ? 0 : parsedValue;
        }
    }
    setFormData(updatedFormData);
  };

  const handleClosedToggle = (checked: boolean) => {
    setFormData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            isClosed: checked,
            totalSales: checked ? 0 : prev.totalSales,
            morningSales: checked ? 0 : prev.morningSales
        };
    });
  };

  const handleExpenseChange = (catIndex: number, itemIndex: number, valueStr: string) => {
    const newExpenses = [...expenses];
    let val = parseFloat(valueStr);
    if (isNaN(val)) val = 0;
    
    // Ensure mutation actually happens on new reference
    newExpenses[catIndex] = {
        ...newExpenses[catIndex],
        items: [...newExpenses[catIndex].items]
    };
    newExpenses[catIndex].items[itemIndex] = {
        ...newExpenses[catIndex].items[itemIndex],
        amount: val
    };

    setFormData({ ...formData, expenses: newExpenses });
  };
  
  const handlePhotosChange = (catIndex: number, itemIndex: number, photos: string[]) => {
    const newExpenses = [...expenses];
    newExpenses[catIndex].items[itemIndex].billPhotos = photos;
    setFormData({ ...formData, expenses: newExpenses });
  };
  
  const handleAddNewItem = () => {
    if (!newItem.name.trim()) { alert("Item name cannot be empty."); return; }
    const newExpenses = [...expenses];
    const category = newExpenses[newItem.categoryIndex];
    if(category.items.some(item => item.name.toLowerCase() === newItem.name.trim().toLowerCase())) {
        alert("This item already exists in the category."); return;
    }
    category.items.push({ id: uuidv4(), name: newItem.name.trim(), amount: 0, billPhotos: [] });
    setFormData({ ...formData, expenses: newExpenses });
    if (newItem.saveForFuture) {
        handleSaveCustomItem(category.name, newItem.name.trim(), newItem.defaultValue || 0);
    }
    setAddItemModalOpen(false);
  };

  const handleAddNewCategory = () => {
    if (!formData) return;
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      alert("Category name cannot be empty.");
      return;
    }
    if (formData.expenses.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("This category already exists in this record.");
      return;
    }
    const newCategory = {
      id: uuidv4(),
      name: trimmedName,
      items: [],
    };
    const updatedExpenses = [...formData.expenses, newCategory];
    setFormData({ ...formData, expenses: updatedExpenses });
    setAddCategoryModalOpen(false);
    setNewCategoryName('');

    setTimeout(() => {
      toggleCategory(trimmedName);
    }, 100);
  };

  const confirmRemoveExpenseItem = () => {
    if (deleteConfirmation) {
        const { catIndex, itemIndex } = deleteConfirmation;
        const newExpenses = [...expenses];
        newExpenses[catIndex].items.splice(itemIndex, 1);
        setFormData({ ...formData, expenses: newExpenses });
        setDeleteConfirmation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) { alert('Please select a date.'); return; }
    if (dateError) { alert(dateError); return; }
    await handleSave(formData, isEditing ? recordId : undefined);
    navigate(`/records/${formData.id}`);
  };

  const scrollToCategory = (categoryName: string) => {
      // Small delay to allow the accordion animation to start/layout to update
      setTimeout(() => {
          const element = categoryRefs.current[categoryName];
          if (!element) return;

          const stickyOffset = (stickyHeaderRef.current?.offsetHeight || 110) + 64; 
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - stickyOffset - 10;

          window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
          });
      }, 300);
  };

  const toggleCategory = (categoryName: string) => {
    if (isSearching) return;
    const isOpening = openCategory !== categoryName;
    const newOpenCategory = isOpening ? categoryName : null;
    
    setOpenCategory(newOpenCategory);
    
    if (isOpening) {
        scrollToCategory(categoryName);
        localStorage.setItem('ayshas-last-open-category', categoryName);
    } else {
        localStorage.removeItem('ayshas-last-open-category');
    }
  };

  const handleGoToNextCategory = (currentCatIndex: number) => {
    if (!formData) return;
    const nextCategory = formData.expenses[currentCatIndex + 1];
    if (nextCategory) {
        toggleCategory(nextCategory.name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-44">
      {/* Primary Info Section */}
      <div className="bg-surface-container dark:bg-surface-dark-container p-4 rounded-[24px] shadow-sm space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-surface-on dark:text-surface-on-dark">Daily Sales</h3>
            <Switch checked={!!formData.isClosed} onChange={handleClosedToggle} label="Mark as Closed / Off" />
        </div>
        
        <div>
            <label htmlFor="date" className="block text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1 ml-1">Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl border-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-surface-on dark:text-surface-on-dark" />
        </div>

        {formData.isClosed ? (
             <div className="p-4 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl text-center border border-dashed border-surface-outline/30 dark:border-surface-outline-dark/30">
                <p className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm font-medium">Shop Marked as Closed</p>
                <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-1 opacity-70">Sales are set to 0. You can still add fixed expenses below.</p>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <OutlinedInput label="Morning Sales" id="morningSales" value={morningSales === 0 ? '' : morningSales} onChange={handleInputChange} type="number" inputMode="decimal" prefix />
                    <OutlinedInput label="Total Sales" id="totalSales" value={totalSales === 0 ? '' : totalSales} onChange={handleInputChange} type="number" inputMode="decimal" prefix />
                </div>

                <div className="flex justify-between items-center p-4 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl">
                    <span className="text-surface-on-variant dark:text-surface-on-variant-dark text-sm font-medium">Night Sales (Calc)</span>
                    <span className="text-lg font-bold text-surface-on dark:text-surface-on-dark">₹{nightSales.toLocaleString('en-IN')}</span>
                </div>

                {nightSales < 0 && (
                    <div className="flex items-start p-3 text-sm bg-error-container dark:bg-error-container-dark text-error-on-container dark:text-error-on-container-dark rounded-xl">
                        <WarningIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Morning Sales cannot exceed Total Sales.</span>
                    </div>
                )}
            </>
        )}
        
        {dateError && (
             <div className="flex items-start p-3 text-sm bg-error-container dark:bg-error-container-dark text-error-on-container dark:text-error-on-container-dark rounded-xl">
                <WarningIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                 <span>{dateError}</span>
            </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="space-y-4">
        {/* Sticky Header Wrapper */}
        <div ref={stickyHeaderRef} className="sticky top-[64px] z-20 bg-surface dark:bg-surface-dark pt-2 pb-3 -mx-4 px-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-lg font-medium text-surface-on dark:text-surface-on-dark">Expenses</h3>
                <div className="text-sm font-bold text-error dark:text-error-dark">Total: ₹{totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            
            <div className="relative">
                <input
                    type="text"
                    placeholder="Find expense..."
                    value={expenseSearchTerm}
                    onChange={(e) => setExpenseSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-full border-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant dark:placeholder-surface-on-variant-dark"
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-on-variant dark:text-surface-on-variant-dark" />
            </div>
        </div>

        {filteredIndices.map(({ catIndex, itemIndices }) => {
          const category = formData.expenses[catIndex];
          const categoryTotal = category.items.reduce((sum, item) => sum + (item.amount || 0), 0);
          const isOpen = isSearching || openCategory === category.name;
          
          return (
            <div 
                key={category.id} 
                ref={el => { if (el) categoryRefs.current[category.name] = el }} 
                className={`rounded-[20px] overflow-hidden transition-all duration-300 border border-surface-outline/10 dark:border-surface-outline-dark/10 ${isOpen ? 'bg-surface-container dark:bg-surface-dark-container shadow-sm ring-1 ring-primary/20 dark:ring-primary-dark/20' : 'bg-surface-container dark:bg-surface-dark-container'}`}
            >
              <button type="button" onClick={() => toggleCategory(category.name)} className="w-full flex justify-between items-center p-4 text-left active:bg-surface-container-high dark:active:bg-surface-dark-container-high" aria-expanded={isOpen} disabled={isSearching}>
                <div className="flex flex-col">
                  <span className={`text-base font-medium ${isOpen ? 'text-primary dark:text-primary-dark' : 'text-surface-on dark:text-surface-on-dark'}`}>{category.name}</span>
                  <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5">₹{safeFloat(categoryTotal).toLocaleString('en-IN')}</span>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-surface-on-variant dark:text-surface-on-variant-dark transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4">
                    <div className="h-px w-full bg-surface-outline/10 dark:bg-surface-outline-dark/10 mb-2"></div>
                    
                    {/* SCROLLABLE ITEM LIST */}
                    <div className="space-y-0">
                        {itemIndices.map((itemIndex) => {
                        const item = category.items[itemIndex];
                        return (
                        <div key={item.id} className="group flex items-center gap-3 py-3 border-b border-surface-outline/5 dark:border-surface-outline-dark/5 last:border-0">
                            
                            {/* Name & Delete - Left Side */}
                            <div className="flex-grow min-w-0 mr-1">
                                <div className="flex items-center gap-2">
                                    <label htmlFor={`${category.id}-${item.id}`} className="text-sm font-medium text-surface-on dark:text-surface-on-dark cursor-pointer select-none">
                                        {item.name}
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setDeleteConfirmation({catIndex, itemIndex, itemName: item.name})} 
                                        className="p-1.5 text-surface-on-variant/50 hover:text-error dark:hover:text-error-dark transition-colors rounded-full" 
                                        aria-label={`Remove ${item.name}`}
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>

                            {/* Controls - Right Side */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                
                                {/* Minimal Input */}
                                <div className="relative w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-on-variant dark:text-surface-on-variant-dark text-sm pointer-events-none">₹</span>
                                    <input 
                                        id={`${category.id}-${item.id}`}
                                        value={item.amount === 0 ? '' : item.amount}
                                        onChange={(e) => handleExpenseChange(catIndex, itemIndex, e.target.value)}
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        className="w-full h-10 pl-6 pr-3 bg-surface-container-highest/50 dark:bg-surface-dark-container-highest/50 focus:bg-surface-container-highest dark:focus:bg-surface-dark-container-highest rounded-xl text-right text-base font-semibold text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant/50 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>

                                {/* Camera Button */}
                                {billUploadCategories.includes(category.name) && (
                                    <ImageUpload billPhotos={item.billPhotos} onPhotosChange={(photos) => handlePhotosChange(catIndex, itemIndex, photos)} />
                                )}
                            </div>
                        </div>
                        )})}
                    </div>
                    
                    {/* ACTION BUTTONS (fixed at bottom of category) */}
                    <div className="flex gap-2 pt-6 mt-4">
                        <button 
                            type="button" 
                            onClick={() => { setNewItem({ name: '', categoryIndex: catIndex, saveForFuture: false, defaultValue: 0 }); setAddItemModalOpen(true); }} 
                            className="flex-1 py-3 flex items-center justify-center text-sm font-medium text-primary dark:text-primary-dark bg-primary-container/30 dark:bg-primary-container-dark/30 hover:bg-primary-container/50 dark:hover:bg-primary-container-dark/50 rounded-full transition-colors">
                        <PlusIcon className="w-4 h-4 mr-2"/> Add Item
                        </button>
                        {catIndex < formData.expenses.length - 1 && !isSearching && (
                        <button
                            type="button"
                            onClick={() => handleGoToNextCategory(catIndex)}
                            className="flex-1 py-3 flex items-center justify-center text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark bg-surface-container-high dark:bg-surface-dark-container-high hover:bg-surface-container-highest dark:hover:bg-surface-dark-container-highest rounded-full transition-colors"
                        >
                            Next
                            <ChevronRightIcon className="w-4 h-4 ml-2" />
                        </button>
                        )}
                    </div>
                </div>
              </div>
            </div>
          )
        })}

        {isSearching && filteredIndices.length === 0 && (
          <div className="p-6 text-center text-surface-on-variant dark:text-surface-on-variant-dark">
            No matches found for "{expenseSearchTerm}"
          </div>
        )}

        <button 
          type="button" 
          onClick={() => setAddCategoryModalOpen(true)} 
          className="w-full py-4 text-sm font-medium text-primary dark:text-primary-dark border border-dashed border-primary/50 dark:border-primary-dark/50 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary-dark/5 active:bg-primary/10 transition-colors flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2"/> Add New Category
        </button>
      </div>
      
      {/* MD3 Sticky Footer Actions */}
      <div ref={footerRef} className="fixed bottom-0 left-0 right-0 bg-surface dark:bg-surface-dark z-40 border-t border-surface-outline/10 dark:border-surface-outline-dark/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
             <div className="flex flex-col">
                <span className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark font-medium uppercase tracking-wider">Net Profit</span>
                <span className={`text-xl font-bold ${profit >= 0 ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>
                    {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
                </span>
             </div>
             <div className="flex gap-2">
                 <button type="button" onClick={() => navigate(-1)} className="px-6 h-12 rounded-full border border-surface-outline/30 dark:border-surface-outline-dark/30 text-surface-on dark:text-surface-on-dark font-medium hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high">
                     Cancel
                 </button>
                 <button type="submit" disabled={!!dateError} className="px-8 h-12 rounded-full bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark font-medium shadow-md hover:bg-primary/90 dark:hover:bg-primary-dark/90 disabled:opacity-50 disabled:cursor-not-allowed">
                     Save
                 </button>
             </div>
        </div>
      </div>
      
      {/* Modals reused with updated styling via Modal component */}
      {isAddItemModalOpen && (
        <Modal onClose={() => setAddItemModalOpen(false)}>
            <div className="p-6 bg-surface-container dark:bg-surface-dark-container rounded-[28px]">
                <h3 className="text-xl font-medium mb-6 text-surface-on dark:text-surface-on-dark">New Expense Item</h3>
                <div className="space-y-4">
                    <OutlinedInput id="newItemName" label="Item Name" value={newItem.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, name: e.target.value})} parentBg="bg-surface-container dark:bg-surface-dark-container" />
                    
                    <label className="flex items-center space-x-3 p-2 cursor-pointer">
                        <input type="checkbox" checked={newItem.saveForFuture} onChange={(e) => setNewItem({...newItem, saveForFuture: e.target.checked})} className="w-5 h-5 text-primary dark:text-primary-dark border-surface-outline rounded focus:ring-primary dark:focus:ring-primary-dark bg-transparent"/>
                        <span className="text-sm text-surface-on dark:text-surface-on-dark">Save for future entries</span>
                    </label>

                    {newItem.saveForFuture && (
                       <OutlinedInput id="defaultValue" label="Default Amount" type="number" value={newItem.defaultValue === 0 ? '' : newItem.defaultValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, defaultValue: parseFloat(e.target.value) || 0})} prefix parentBg="bg-surface-container dark:bg-surface-dark-container" />
                    )}
                </div>
                <div className="mt-8 flex justify-end gap-2">
                    <button type="button" onClick={() => setAddItemModalOpen(false)} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/30 dark:hover:bg-primary-container-dark/30 rounded-full">Cancel</button>
                    <button type="button" onClick={handleAddNewItem} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium">Add</button>
                </div>
            </div>
        </Modal>
      )}

      {isAddCategoryModalOpen && (
        <Modal onClose={() => setAddCategoryModalOpen(false)}>
            <div className="p-6 bg-surface-container dark:bg-surface-dark-container rounded-[28px]">
                <h3 className="text-xl font-medium mb-6 text-surface-on dark:text-surface-on-dark">New Category</h3>
                <OutlinedInput id="newCategoryName" label="Category Name" value={newCategoryName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)} parentBg="bg-surface-container dark:bg-surface-dark-container" />
                <div className="mt-8 flex justify-end gap-2">
                    <button type="button" onClick={() => setAddCategoryModalOpen(false)} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/30 dark:hover:bg-primary-container-dark/30 rounded-full">Cancel</button>
                    <button type="button" onClick={handleAddNewCategory} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium">Add</button>
                </div>
            </div>
        </Modal>
      )}

      {deleteConfirmation && (
        <Modal onClose={() => setDeleteConfirmation(null)} size="alert">
            <div className="p-6 pb-2 text-center">
                 <div className="flex justify-center mb-4 text-secondary dark:text-secondary-dark">
                    <TrashIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-normal mb-4 text-surface-on dark:text-surface-on-dark">Delete Item?</h3>
                <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark leading-relaxed">
                    Are you sure you want to remove <span className="font-semibold">{deleteConfirmation.itemName}</span>?
                </p>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteConfirmation(null)} className="px-3 py-2 text-sm font-medium text-primary dark:text-primary-dark rounded-full hover:bg-primary/10 dark:hover:bg-primary-dark/10 transition-colors">Cancel</button>
                <button type="button" onClick={confirmRemoveExpenseItem} className="px-3 py-2 text-sm font-medium text-error dark:text-error-dark rounded-full hover:bg-error/10 dark:hover:bg-error-dark/10 transition-colors">Delete</button>
            </div>
        </Modal>
      )}
    </form>
  );
};

export default RecordForm;
