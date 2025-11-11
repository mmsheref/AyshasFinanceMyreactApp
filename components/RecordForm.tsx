import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DailyRecord, ExpenseCategory, CustomExpenseStructure } from '../types';
import { generateNewRecordExpenses, FALLBACK_ITEM_COSTS } from '../constants';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ChevronDownIcon, WarningIcon } from './Icons';

interface RecordFormProps {
  record: DailyRecord | null;
  onSave: (record: DailyRecord) => void;
  onCancel: () => void;
  allRecords: DailyRecord[];
  customStructure: CustomExpenseStructure;
  onSaveCustomItem: (categoryName: string, itemName: string) => void;
}

const RecordForm: React.FC<RecordFormProps> = ({ record, onSave, onCancel, allRecords, customStructure, onSaveCustomItem }) => {
  const [formData, setFormData] = useState<DailyRecord>(() => {
    if (record) {
      return JSON.parse(JSON.stringify(record));
    }
    
    const newStructure = generateNewRecordExpenses(customStructure);
    const mostRecentRecord = allRecords[0];

    newStructure.forEach(category => {
      category.items.forEach(item => {
        let amount = 0;
        const recentCategory = mostRecentRecord?.expenses.find(c => c.name === category.name);
        const recentItem = recentCategory?.items.find(i => i.name === item.name);

        if ((category.name === 'Labours' || category.name === 'Fixed Costs') && recentItem) {
          amount = recentItem.amount;
        } else if (FALLBACK_ITEM_COSTS[item.name]) {
          amount = FALLBACK_ITEM_COSTS[item.name];
        }
        item.amount = amount;
      });
    });

    const today = new Date().toISOString().split('T')[0];
    return {
      id: today,
      date: today,
      totalSales: 0,
      expenses: newStructure
    };
  });

  const [dateError, setDateError] = useState('');
  const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', categoryIndex: 0, saveForFuture: false });
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    return localStorage.getItem('ayshas-last-open-category') || formData.expenses[0]?.name || null;
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{catIndex: number, itemIndex: number, itemName: string} | null>(null);
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (!record) {
        const dateExists = allRecords.some(r => r.id === formData.date);
        if (dateExists) {
            setDateError('A record for this date already exists.');
        } else {
            setDateError('');
        }
    }
  }, [formData.date, allRecords, record]);

  const totalExpenses = useMemo(() => formData.expenses.reduce((total, category) => 
    total + category.items.reduce((catTotal, item) => catTotal + (item.amount || 0), 0), 0), [formData.expenses]);
  
  const profit = useMemo(() => (formData.totalSales || 0) - totalExpenses, [formData.totalSales, totalExpenses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
        setFormData({ ...formData, date: value, id: value });
    } else {
        const parsedValue = parseFloat(value);
        setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
    }
  };

  const handleExpenseChange = (catIndex: number, itemIndex: number, value: number) => {
    const newExpenses = [...formData.expenses];
    newExpenses[catIndex].items[itemIndex].amount = value;
    setFormData({ ...formData, expenses: newExpenses });
  };
  
  const handlePhotosChange = (catIndex: number, itemIndex: number, photos: string[]) => {
    const newExpenses = [...formData.expenses];
    newExpenses[catIndex].items[itemIndex].billPhotos = photos;
    setFormData({ ...formData, expenses: newExpenses });
  };
  
  const openAddItemModal = (catIndex: number) => {
    setNewItem({ name: '', categoryIndex: catIndex, saveForFuture: false });
    setAddItemModalOpen(true);
  };

  const handleAddNewItem = () => {
    if (!newItem.name.trim()) {
        alert("Item name cannot be empty.");
        return;
    }
    const newExpenses = [...formData.expenses];
    const category = newExpenses[newItem.categoryIndex];
    
    if(category.items.some(item => item.name.toLowerCase() === newItem.name.trim().toLowerCase())) {
        alert("This item already exists in the category.");
        return;
    }

    category.items.push({ id: uuidv4(), name: newItem.name.trim(), amount: 0, billPhotos: [] });
    setFormData({ ...formData, expenses: newExpenses });

    if (newItem.saveForFuture) {
        onSaveCustomItem(category.name, newItem.name.trim());
    }
    setAddItemModalOpen(false);
  };

  const confirmRemoveExpenseItem = () => {
    if (deleteConfirmation) {
        const { catIndex, itemIndex } = deleteConfirmation;
        const newExpenses = [...formData.expenses];
        newExpenses[catIndex].items.splice(itemIndex, 1);
        setFormData({ ...formData, expenses: newExpenses });
        setDeleteConfirmation(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      alert('Please select a date.');
      return;
    }
    if (dateError && !record) {
      alert(dateError);
      return;
    }
    onSave(formData);
  };

  const toggleCategory = (categoryName: string) => {
    const isOpening = openCategory !== categoryName;
    const newOpenCategory = isOpening ? categoryName : null;
    setOpenCategory(newOpenCategory);

    if (newOpenCategory) {
        localStorage.setItem('ayshas-last-open-category', newOpenCategory);
        setTimeout(() => {
            categoryRefs.current[categoryName]?.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Delay to allow accordion to open
    } else {
        localStorage.removeItem('ayshas-last-open-category');
    }
  };

  const inputStyles = "w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Date and Sales */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={inputStyles}
            />
          </div>
          <div>
            <label htmlFor="totalSales" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Sales</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
              <input
                type="text"
                inputMode="decimal"
                id="totalSales"
                name="totalSales"
                value={formData.totalSales === 0 ? '' : formData.totalSales}
                onChange={handleInputChange}
                className={`${inputStyles} pl-7`}
                placeholder="Can be added later"
              />
            </div>
          </div>
        </div>
        {dateError && <p className="text-sm text-amber-600 col-span-2">{dateError}</p>}
      </div>

      {/* Expenses */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 px-1">Expenses</h3>
        {formData.expenses.map((category, catIndex) => {
          const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
          const isOpen = openCategory === category.name;
          return (
            <div key={category.id} ref={el => categoryRefs.current[category.name] = el} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <h4 className="text-lg font-semibold text-primary">{category.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total: ₹{categoryTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
              </button>
              {isOpen && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
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
                                value={item.amount === 0 ? '' : item.amount}
                                onChange={(e) => handleExpenseChange(catIndex, itemIndex, parseFloat(e.target.value) || 0)}
                                className={`${inputStyles} pl-7 pr-2 py-1.5`}
                                placeholder="0"
                                />
                            </div>
                            {category.name === 'Market Bills' && (
                              <ImageUpload 
                                  billPhotos={item.billPhotos}
                                  onPhotosChange={(photos) => handlePhotosChange(catIndex, itemIndex, photos)} 
                              />
                            )}
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => openAddItemModal(catIndex)} className="mt-2 flex items-center text-sm font-medium text-secondary hover:text-primary">
                      <PlusIcon className="w-4 h-4 mr-1"/>
                      Add New Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom)]">
        <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sales</p>
                    <p className="font-bold text-primary truncate">₹{(formData.totalSales || 0).toLocaleString('en-IN')}</p>
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
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary shadow-sm transition-colors">Save Record</button>
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
                        <input
                            type="text"
                            id="newItemName"
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                            className={inputStyles}
                            placeholder="e.g., New Supplier"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="saveForFuture"
                            type="checkbox"
                            checked={newItem.saveForFuture}
                            onChange={(e) => setNewItem({...newItem, saveForFuture: e.target.checked})}
                            className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
                        />
                        <label htmlFor="saveForFuture" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Save this item for future entries</label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setAddItemModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={handleAddNewItem} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Add Item</button>
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
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Are you sure you want to permanently delete the item: <br/> <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteConfirmation.itemName}</span>?
                </p>
                <div className="flex justify-center space-x-4">
                    <button type="button" onClick={() => setDeleteConfirmation(null)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button type="button" onClick={confirmRemoveExpenseItem} className="px-5 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm transition-colors">Delete Item</button>
                </div>
            </div>
        </Modal>
      )}
    </form>
  );
};

export default RecordForm;