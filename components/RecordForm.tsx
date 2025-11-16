import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DailyRecord } from '../types';
import { generateNewRecordExpenses, CATEGORIES_WITH_BILL_UPLOAD } from '../constants';
import { useAppContext } from '../context/AppContext';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ChevronDownIcon, WarningIcon, SearchIcon, ChevronRightIcon } from './Icons';

const RECURRING_EXPENSE_CATEGORIES = ['Labours', 'Fixed Costs'];

const RecordForm: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { 
    getRecordById, 
    handleSave, 
    sortedRecords, 
    customStructure, 
    handleSaveCustomItem,
    records: allRecords
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

  useEffect(() => {
    const initializeForm = () => {
      if (isEditing) {
        const recordToEdit = getRecordById(recordId);
        if (recordToEdit) {
          setFormData(JSON.parse(JSON.stringify(recordToEdit))); // Deep copy
        } else {
          navigate('/records'); // Record not found, redirect
        }
      } else {
        const newExpenses = generateNewRecordExpenses(customStructure);
        const mostRecentRecord = sortedRecords[0];

        if (mostRecentRecord) {
            newExpenses.forEach(category => {
                if (RECURRING_EXPENSE_CATEGORIES.includes(category.name)) {
                    const correspondingOldCategory = mostRecentRecord.expenses.find(c => c.name === category.name);
                    if (correspondingOldCategory) {
                        category.items.forEach(item => {
                            const correspondingOldItem = correspondingOldCategory.items.find(i => i.name === item.name);
                            if (correspondingOldItem) {
                                item.amount = correspondingOldItem.amount;
                            }
                        });
                    }
                }
            });
        }
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          id: today, date: today, totalSales: 0, morningSales: 0, expenses: newExpenses
        });
        setOpenCategory(localStorage.getItem('ayshas-last-open-category') || newExpenses[0]?.name || null);
      }
    };
    initializeForm();
  }, [recordId, isEditing, getRecordById, navigate, customStructure, sortedRecords]);

  useEffect(() => {
    if (!formData?.date) {
      setDateError('');
      return;
    }
    // A date is invalid if a record exists with that date, AND it's not the record we are currently editing.
    // For new records, `recordId` is undefined, so the check correctly flags any existing record.
    const dateIsTakenByAnotherRecord = allRecords.some(r => r.id === formData.date && r.id !== recordId);
    
    setDateError(dateIsTakenByAnotherRecord ? 'A record for this date already exists.' : '');

  }, [formData?.date, allRecords, recordId]);

  const totalExpenses = useMemo(() => {
    if (!formData) return 0;
    return formData.expenses.reduce((total, category) => 
        total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 
    0);
  }, [formData?.expenses]);
  
  const profit = useMemo(() => {
    if (!formData) return 0;
    return (formData.totalSales || 0) - totalExpenses;
  }, [formData?.totalSales, totalExpenses]);

  const nightSales = useMemo(() => {
    if (!formData) return 0;
    return (formData.totalSales || 0) - (formData.morningSales || 0);
  }, [formData?.totalSales, formData?.morningSales]);

  const filteredExpenses = useMemo(() => {
    if (!formData) return [];
    
    const mappedExpenses = formData.expenses.map((category, catIndex) => ({
      ...category,
      originalIndex: catIndex,
      items: category.items.map((item, itemIndex) => ({
        ...item,
        originalIndex: itemIndex
      }))
    }));

    const trimmedSearch = expenseSearchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return mappedExpenses;
    }

    return mappedExpenses
      .map(category => ({
        ...category,
        items: category.items.filter(item => item.name.toLowerCase().includes(trimmedSearch))
      }))
      .filter(category => category.items.length > 0);
  }, [formData, expenseSearchTerm]);

  if (!formData) return null; // Or a loading spinner

  const { totalSales, expenses, morningSales } = formData;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData };
    if (name === 'date') {
        updatedFormData.date = value;
        updatedFormData.id = value;
    } else {
        const parsedValue = parseFloat(value);
        (updatedFormData as any)[name] = isNaN(parsedValue) ? 0 : parsedValue;
    }
    setFormData(updatedFormData);
  };

  const handleExpenseChange = (catIndex: number, itemIndex: number, value: number) => {
    const newExpenses = [...expenses];
    newExpenses[catIndex].items[itemIndex].amount = value;
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
      setOpenCategory(trimmedName);
      const newCategoryRef = categoryRefs.current[trimmedName];
      if (newCategoryRef) {
          newCategoryRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
    // Pass the original recordId when editing, so the context knows how to handle date changes.
    await handleSave(formData, isEditing ? recordId : undefined);
    navigate(`/records/${formData.id}`);
  };

  const toggleCategory = (categoryName: string) => {
    const newOpenCategory = openCategory !== categoryName ? categoryName : null;
    setOpenCategory(newOpenCategory);
    if (newOpenCategory) localStorage.setItem('ayshas-last-open-category', newOpenCategory);
    else localStorage.removeItem('ayshas-last-open-category');
  };

  const handleGoToNextCategory = (currentCatIndex: number) => {
    if (!formData) return;
    const nextCategory = formData.expenses[currentCatIndex + 1];
    if (nextCategory) {
        toggleCategory(nextCategory.name); // This closes the old and opens the new one.
        
        // Use a timeout to allow the accordion to open before scrolling
        setTimeout(() => {
            const nextCategoryRef = categoryRefs.current[nextCategory.name];
            if (nextCategoryRef) {
                nextCategoryRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300); // 300ms should be enough for the transition
    }
  };
  
  const scrollInputIntoView = (inputElement: HTMLInputElement) => {
    if (!inputElement) return;

    // We use requestAnimationFrame to run our check after the browser has handled
    // the focus event and performed its own default scrolling. This is more reliable
    // than a fixed-duration setTimeout.
    requestAnimationFrame(() => {
        const footer = footerRef.current;
        const header = document.querySelector('header');

        if (!footer || !header) return;

        const footerHeight = footer.offsetHeight;
        const headerHeight = header.offsetHeight;
        const inputRect = inputElement.getBoundingClientRect();
        
        // Add a 20px buffer to ensure the input is not right at the edge.
        const PADDING = 20; 

        let scrollAdjustment = 0;

        // Check if the input is obscured by the bottom sticky footer
        if (inputRect.bottom > (window.innerHeight - footerHeight)) {
            // The amount the input is obscured by. We need to scroll down by this amount.
            // A positive value for window.scrollBy scrolls the page down, moving the content up.
            scrollAdjustment = inputRect.bottom - (window.innerHeight - footerHeight) + PADDING;
        } 
        // Check if the input is obscured by the top sticky header
        else if (inputRect.top < headerHeight) {
            // The amount the input is obscured by. We need to scroll up by this amount.
            // A negative value for window.scrollBy scrolls the page up, moving the content down.
            scrollAdjustment = inputRect.top - headerHeight - PADDING;
        }

        if (scrollAdjustment !== 0) {
            window.scrollBy({
                top: scrollAdjustment,
                behavior: 'smooth'
            });
        }
    });
  };

  const handleExpenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Gboard and other mobile keyboards might send keycode 229 for composition events, 
    // and 'Enter' might not always be the key. Keycode 13 is more reliable for the Enter/Go action.
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    
    // This prevents form submission on mobile "Go" button, which is what we want.
    e.preventDefault();

    const allVisibleInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[data-expense-input="true"]')
    );

    const currentInput = e.target as HTMLInputElement;
    const currentIndex = allVisibleInputs.findIndex(input => input.id === currentInput.id);

    if (currentIndex > -1 && currentIndex < allVisibleInputs.length - 1) {
      // There is a next input, focus it.
      const nextInput = allVisibleInputs[currentIndex + 1];
      nextInput.focus();
      nextInput.select();
      scrollInputIntoView(nextInput);
    } else {
      // This is the last input, so blur it to dismiss the keyboard.
      currentInput.blur();
    }
  };


  const inputStyles = "w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200";
  const isSearching = expenseSearchTerm.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-40">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-4">
        <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} className={inputStyles} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="morningSales" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Morning Sales</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
              <input type="text" inputMode="decimal" id="morningSales" name="morningSales" value={morningSales === 0 ? '' : morningSales} onChange={handleInputChange} className={`${inputStyles} pl-7`} placeholder="0" />
            </div>
          </div>
          <div>
            <label htmlFor="totalSales" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Sales</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
              <input type="text" inputMode="decimal" id="totalSales" name="totalSales" value={totalSales === 0 ? '' : totalSales} onChange={handleInputChange} className={`${inputStyles} pl-7`} placeholder="Morning + Night"/>
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Night Sales</label>
            <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400 mr-1">₹</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{nightSales.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        {nightSales < 0 && (
            <div className="flex items-start p-3 text-sm bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-300">
                <WarningIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Morning Sales should not be greater than Total Sales. Please check your inputs.</span>
            </div>
        )}
        {dateError && (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{dateError}</p>
                <button type="button" onClick={() => navigate(`/records/${formData.date}`)} className="ml-4 px-3 py-1 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/80">View Existing</button>
            </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 px-1">Expenses</h3>
        <div className="relative">
            <input
                type="text"
                placeholder="Search for an expense item..."
                value={expenseSearchTerm}
                onChange={(e) => setExpenseSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        {filteredExpenses.map((category) => {
          const catIndex = category.originalIndex;
          const fullCategory = formData.expenses[catIndex];
          const categoryTotal = fullCategory.items.reduce((sum, item) => sum + item.amount, 0);
          const isOpen = isSearching || openCategory === category.name;
          
          return (
            <div 
                key={category.id} 
                ref={el => { if (el) categoryRefs.current[category.name] = el }} 
                className={`rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}
            >
              <button type="button" onClick={() => toggleCategory(category.name)} className="w-full flex justify-between items-center p-4 text-left" aria-expanded={isOpen} disabled={isSearching}>
                <div>
                  <h4 className="text-lg font-semibold text-primary">{category.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total: ₹{categoryTotal.toLocaleString('en-IN')}</p>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 dark:text-slate-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-4 pt-4">
                    {category.items.map((item) => {
                      const itemIndex = item.originalIndex;
                      return (
                      <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                        <label htmlFor={`${category.id}-${item.id}`} className="text-slate-700 dark:text-slate-300 font-medium pr-2 truncate">{item.name}</label>
                        <button type="button" onClick={() => setDeleteConfirmation({catIndex, itemIndex, itemName: item.name})} className="text-slate-400 hover:text-error p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Remove ${item.name}`}>
                          <TrashIcon className="w-5 h-5"/>
                        </button>
                        <div className="col-span-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    id={`${category.id}-${item.id}`}
                                    data-expense-input="true"
                                    value={item.amount === 0 ? '' : item.amount} 
                                    onChange={(e) => handleExpenseChange(catIndex, itemIndex, parseFloat(e.target.value) || 0)} 
                                    onKeyDown={handleExpenseKeyDown}
                                    onFocus={(e) => scrollInputIntoView(e.target as HTMLInputElement)}
                                    className={`${inputStyles} pl-7 pr-2 py-1.5`} 
                                    placeholder="0" 
                                />
                            </div>
                            {CATEGORIES_WITH_BILL_UPLOAD.includes(category.name) && (
                              <ImageUpload billPhotos={item.billPhotos} onPhotosChange={(photos) => handlePhotosChange(catIndex, itemIndex, photos)} />
                            )}
                        </div>
                      </div>
                    )})}
                    <div className="mt-4 flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button 
                            type="button" 
                            onClick={() => { setNewItem({ name: '', categoryIndex: catIndex, saveForFuture: false, defaultValue: 0 }); setAddItemModalOpen(true); }} 
                            className="flex-grow flex items-center justify-center text-sm font-medium text-secondary p-2 rounded-lg hover:bg-secondary/10">
                          <PlusIcon className="w-4 h-4 mr-2"/> Add New Item
                        </button>
                        {catIndex < formData.expenses.length - 1 && !isSearching && (
                          <button
                            type="button"
                            onClick={() => handleGoToNextCategory(catIndex)}
                            className="flex-grow flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            Next Category
                            <ChevronRightIcon className="w-4 h-4 ml-2" />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {isSearching && filteredExpenses.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm text-center text-slate-500 dark:text-slate-400">
            No expense items found matching "{expenseSearchTerm}".
          </div>
        )}

        <button 
          type="button" 
          onClick={() => setAddCategoryModalOpen(true)} 
          className="mt-2 w-full text-sm font-semibold flex items-center justify-center p-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2"/> Add New Category
        </button>
      </div>
      
      <div ref={footerRef} className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40 border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.2)]">
        <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sales</p>
                    <p className="font-bold text-primary truncate">₹{(totalSales || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Expenses</p>
                    <p className="font-bold text-error truncate">₹{totalExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{profit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={`font-bold ${profit >= 0 ? 'text-success' : 'text-error'} truncate`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
                </div>
            </div>
          <div className="flex justify-end items-center space-x-3">
            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={!!dateError} className="px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed">Save Record</button>
          </div>
        </div>
      </div>
      
      {isAddItemModalOpen && (
        <Modal onClose={() => setAddItemModalOpen(false)}>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
                <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Add New Expense Item</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newItemName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                        <input type="text" id="newItemName" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className={inputStyles} placeholder="e.g., New Supplier"/>
                    </div>
                    <div className="flex items-center">
                        <input id="saveForFuture" type="checkbox" checked={newItem.saveForFuture} onChange={(e) => setNewItem({...newItem, saveForFuture: e.target.checked})} className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary dark:bg-slate-700 dark:border-slate-600"/>
                        <label htmlFor="saveForFuture" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Save this item for future entries</label>
                    </div>
                    {newItem.saveForFuture && (
                       <div>
                         <label htmlFor="defaultValue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Pre-fill Amount</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
                            <input type="number" id="defaultValue" value={newItem.defaultValue === 0 ? '' : newItem.defaultValue} onChange={(e) => setNewItem({...newItem, defaultValue: parseFloat(e.target.value) || 0})} className={`${inputStyles} pl-7`} placeholder="0"/>
                         </div>
                       </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setAddItemModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={handleAddNewItem} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Add Item</button>
                </div>
            </div>
        </Modal>
      )}

      {isAddCategoryModalOpen && (
        <Modal onClose={() => setAddCategoryModalOpen(false)}>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
                <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Add New Expense Category</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newCategoryName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                        <input type="text" id="newCategoryName" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className={inputStyles} placeholder="e.g., Beverages"/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setAddCategoryModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={handleAddNewCategory} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Add Category</button>
                </div>
            </div>
        </Modal>
      )}

      {deleteConfirmation && (
        <Modal onClose={() => setDeleteConfirmation(null)}>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold mt-4 mb-2 dark:text-slate-100">Confirm Deletion</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to permanently delete the item: <br/> <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteConfirmation.itemName}</span>?</p>
                <div className="flex justify-center space-x-4">
                    <button type="button" onClick={() => setDeleteConfirmation(null)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={confirmRemoveExpenseItem} className="px-5 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm">Delete Item</button>
                </div>
            </div>
        </Modal>
      )}
    </form>
  );
};

export default RecordForm;