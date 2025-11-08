import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DailyRecord, ExpenseCategory, CustomExpenseStructure } from '../types';
import { generateNewRecordExpenses, FALLBACK_ITEM_COSTS } from '../constants';
import ImageUpload from './ImageUpload';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

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
  const [openCategory, setOpenCategory] = useState<string | null>(formData.expenses[0]?.name || null);

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
  
  const profit = useMemo(() => formData.totalSales - totalExpenses, [formData.totalSales, totalExpenses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
        setFormData({ ...formData, date: value, id: value });
    } else {
        setFormData({ ...formData, [name]: Number(value) || 0 });
    }
  };

  const handleExpenseChange = (catIndex: number, itemIndex: number, value: number) => {
    const newExpenses = [...formData.expenses];
    newExpenses[catIndex].items[itemIndex].amount = value;
    setFormData({ ...formData, expenses: newExpenses });
  };
  
  const handlePhotoChange = (catIndex: number, itemIndex: number, base64: string | undefined) => {
    const newExpenses = [...formData.expenses];
    newExpenses[catIndex].items[itemIndex].billPhoto = base64;
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

    category.items.push({ id: uuidv4(), name: newItem.name.trim(), amount: 0 });
    setFormData({ ...formData, expenses: newExpenses });

    if (newItem.saveForFuture) {
        onSaveCustomItem(category.name, newItem.name.trim());
    }
    setAddItemModalOpen(false);
  };

  const removeExpenseItem = (catIndex: number, itemIndex: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
        const newExpenses = [...formData.expenses];
        newExpenses[catIndex].items.splice(itemIndex, 1);
        setFormData({ ...formData, expenses: newExpenses });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Date and Sales */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="totalSales" className="block text-sm font-medium text-slate-700 mb-1">Total Sales</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">₹</span>
              <input
                type="number"
                id="totalSales"
                name="totalSales"
                value={formData.totalSales === 0 ? '' : formData.totalSales}
                onChange={handleInputChange}
                required
                className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        {dateError && <p className="text-sm text-amber-600 col-span-2">{dateError}</p>}
      </div>

      {/* Expenses */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-800 px-1">Expenses</h3>
        {formData.expenses.map((category, catIndex) => {
          const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
          const isOpen = openCategory === category.name;
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <h4 className="text-lg font-semibold text-primary">{category.name}</h4>
                  <p className="text-sm text-slate-500">Total: ₹{categoryTotal.toLocaleString('en-IN')}</p>
                </div>
                {isOpen ? <ChevronUpIcon className="w-6 h-6 text-slate-500" /> : <ChevronDownIcon className="w-6 h-6 text-slate-500" />}
              </button>
              {isOpen && (
                <div className="p-4 border-t border-slate-200">
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                        <label htmlFor={`${category.id}-${item.id}`} className="text-slate-700 font-medium pr-2 truncate">{item.name}</label>
                        <button type="button" onClick={() => removeExpenseItem(catIndex, itemIndex)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" aria-label={`Remove ${item.name}`}>
                          <TrashIcon className="w-5 h-5"/>
                        </button>
                        <div className="flex items-center gap-2 col-span-2">
                          <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              id={`${category.id}-${item.id}`}
                              value={item.amount === 0 ? '' : item.amount}
                              onChange={(e) => handleExpenseChange(catIndex, itemIndex, parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                              placeholder="0"
                            />
                          </div>
                          <ImageUpload 
                            billPhoto={item.billPhoto}
                            onPhotoChange={(base64) => handlePhotoChange(catIndex, itemIndex, base64)} 
                          />
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
      <div className="fixed left-0 right-0 bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 bottom-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                    <p className="text-xs text-slate-500">Sales</p>
                    <p className="font-bold text-primary truncate">₹{formData.totalSales.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Expenses</p>
                    <p className="font-bold text-error truncate">₹{totalExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">{profit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={`font-bold ${profit >= 0 ? 'text-success' : 'text-error'} truncate`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
                </div>
            </div>
          <div className="flex justify-end items-center space-x-3">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-secondary text-white rounded-md text-sm font-semibold hover:bg-primary shadow-sm">Save Record</button>
          </div>
        </div>
      </div>
      
      {isAddItemModalOpen && (
        <Modal onClose={() => setAddItemModalOpen(false)}>
            <div className="p-2">
                <h3 className="text-xl font-bold mb-4">Add New Expense Item</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newItemName" className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                        <input
                            type="text"
                            id="newItemName"
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            placeholder="e.g., New Supplier"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="saveForFuture"
                            type="checkbox"
                            checked={newItem.saveForFuture}
                            onChange={(e) => setNewItem({...newItem, saveForFuture: e.target.checked})}
                            className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="saveForFuture" className="ml-2 block text-sm text-slate-900">Save this item for future entries</label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setAddItemModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100">Cancel</button>
                    <button type="button" onClick={handleAddNewItem} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary">Add Item</button>
                </div>
            </div>
        </Modal>
      )}
    </form>
  );
};

export default RecordForm;