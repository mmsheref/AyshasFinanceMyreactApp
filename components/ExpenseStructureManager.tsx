import React, { useState, useEffect, useRef } from 'react';
import { CustomExpenseStructure } from '../types';
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon, ChevronDownIcon, WarningIcon, DownloadIcon, UploadIcon } from './Icons';
import Modal from './Modal';
import { saveStructureFile } from '../utils/capacitor-utils';
import { isCustomStructure } from '../utils/validation-utils';

interface ExpenseStructureManagerProps {
    structure: CustomExpenseStructure;
    onUpdate: (newStructure: CustomExpenseStructure) => void;
}

const ExpenseStructureManager: React.FC<ExpenseStructureManagerProps> = ({ structure, onUpdate }) => {
    const [internalStructure, setInternalStructure] = useState(structure);
    const [isDirty, setIsDirty] = useState(false);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newItem, setNewItem] = useState({ name: '', defaultValue: 0 });
    const [targetCategory, setTargetCategory] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<any>(null);
    const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
    const [structureToImport, setStructureToImport] = useState<CustomExpenseStructure | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInternalStructure(structure);
        setIsDirty(false);
    }, [structure]);

    const handleSaveChanges = () => {
        onUpdate(internalStructure);
        setIsDirty(false);
    };

    const handleDiscardChanges = () => {
        setInternalStructure(structure);
        setIsDirty(false);
    };
    
    const handleItemValueChange = (catName: string, itemIndex: number, value: number) => {
        setInternalStructure(prev => {
            const newStructure = { ...prev };
            const newItems = [...newStructure[catName]];
            newItems[itemIndex] = { ...newItems[itemIndex], defaultValue: value };
            newStructure[catName] = newItems;
            return newStructure;
        });
        setIsDirty(true);
    };

    const toggleCategory = (catName: string) => {
        setOpenCategories(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
    };

    const handleAddCategory = () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) {
            alert('Category name cannot be empty.');
            return;
        }
        if (Object.keys(internalStructure).some(k => k.toLowerCase() === trimmedName.toLowerCase())) {
            alert('A category with this name already exists.');
            return;
        }
        setInternalStructure(prev => ({ ...prev, [trimmedName]: [] }));
        setIsDirty(true);
        setShowAddCategoryModal(false);
        setNewCategoryName('');
    };
    
    const handleAddItem = () => {
        const trimmedName = newItem.name.trim();
        if (!trimmedName) {
            alert('Item name cannot be empty.');
            return;
        }
         if (internalStructure[targetCategory].some(i => i.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert('An item with this name already exists in this category.');
            return;
        }
        setInternalStructure(prev => {
            const newStructure = { ...prev };
            newStructure[targetCategory] = [...newStructure[targetCategory], { name: trimmedName, defaultValue: newItem.defaultValue || 0 }];
            return newStructure;
        });
        setIsDirty(true);
        setShowAddItemModal(false);
        setNewItem({ name: '', defaultValue: 0 });
    };

    const confirmDeletion = () => {
        if (!deleteConfirmation) return;
        const { type, catName, itemName } = deleteConfirmation;
        if (type === 'category') {
            setInternalStructure(prev => {
                const newStructure = { ...prev };
                delete newStructure[catName];
                return newStructure;
            });
        } else if (type === 'item') {
            setInternalStructure(prev => {
                const newStructure = { ...prev };
                newStructure[catName] = newStructure[catName].filter(item => item.name !== itemName);
                return newStructure;
            });
        }
        setIsDirty(true);
        setDeleteConfirmation(null);
    };

    const handleExport = async () => {
        if (Object.keys(structure).length === 0) {
          alert("No structure to export.");
          return;
        }
        const jsonString = JSON.stringify(structure, null, 2);
        const fileName = `ayshas-expense-structure-${new Date().toISOString().split('T')[0]}.json`;
        await saveStructureFile(fileName, jsonString);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File content is not readable.");
            
            const data = JSON.parse(text);

            if (isCustomStructure(data)) {
                setStructureToImport(data);
                setShowImportConfirmModal(true);
            } else {
              throw new Error('Invalid file structure. Please upload a valid expense structure file.');
            }

          } catch (error) {
            alert(error instanceof Error ? error.message : 'An unknown error occurred during file processing.');
          } finally {
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
          }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (structureToImport) {
          setInternalStructure(structureToImport);
          setIsDirty(true);
        }
        setShowImportConfirmModal(false);
        setStructureToImport(null);
    };

    const cancelImport = () => {
        setShowImportConfirmModal(false);
        setStructureToImport(null);
    };

    const sortedCategories = Object.keys(internalStructure).sort((a, b) => a.localeCompare(b));
    const inputStyles = "w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition";
    const buttonClass = "flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors w-full sm:w-auto";

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 sm:gap-0 pb-4 border-b border-slate-200 dark:border-slate-700">
                <button onClick={handleExport} className={buttonClass}>
                    <DownloadIcon className="w-4 h-4 mr-2"/>
                    Export Structure (.json)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className={buttonClass}>
                    <UploadIcon className="w-4 h-4 mr-2"/>
                    Import Structure (.json)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/json"
                  className="hidden"
                />
            </div>

            {sortedCategories.map(catName => (
                <div key={catName} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center p-3">
                        <button onClick={() => toggleCategory(catName)} className="flex-grow flex items-center text-left">
                            <ChevronDownIcon className={`w-5 h-5 mr-2 text-slate-500 transform transition-transform ${openCategories.includes(catName) ? 'rotate-180' : ''}`} />
                            <span className="font-semibold text-primary">{catName}</span>
                        </button>
                        <button onClick={() => setDeleteConfirmation({ type: 'category', catName })} className="p-1 text-slate-500 hover:text-error" aria-label="Delete category">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    {openCategories.includes(catName) && (
                        <div className="px-3 pb-3 space-y-2">
                            {internalStructure[catName].map((item, itemIndex) => (
                                <div key={item.name} className="grid grid-cols-[1fr_auto] items-center p-2 gap-x-2 rounded bg-white dark:bg-slate-900/50">
                                    <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{item.name}</span>
                                    <button onClick={() => setDeleteConfirmation({ type: 'item', catName, itemName: item.name })} className="p-1 text-slate-500 hover:text-error" aria-label="Delete item">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                    <div className="relative col-span-2">
                                        <label htmlFor={`default-${catName}-${itemIndex}`} className="absolute -top-2 left-2 text-xs text-slate-500 bg-white dark:bg-slate-900/50 px-1">Default</label>
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">₹</span>
                                        <input
                                        type="number"
                                        id={`default-${catName}-${itemIndex}`}
                                        value={item.defaultValue === 0 ? '' : item.defaultValue}
                                        onChange={(e) => handleItemValueChange(catName, itemIndex, parseFloat(e.target.value) || 0)}
                                        className="w-full pl-7 pr-2 py-1 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition"
                                        placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setTargetCategory(catName); setShowAddItemModal(true); }} className="w-full text-sm flex items-center justify-center p-2 rounded text-secondary hover:bg-secondary/10 transition-colors">
                                <PlusIcon className="w-4 h-4 mr-1"/> Add Item
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <button onClick={() => setShowAddCategoryModal(true)} className="w-full text-sm font-semibold flex items-center justify-center p-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <PlusIcon className="w-5 h-5 mr-2"/> Add New Category
            </button>

            {isDirty && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handleDiscardChanges} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Discard</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Save Changes</button>
                </div>
            )}

            {/* Modals */}
            {showAddCategoryModal && (
                <Modal onClose={() => setShowAddCategoryModal(false)}>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Add New Category</h3>
                        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g., Beverages" className={inputStyles} />
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowAddCategoryModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                            <button onClick={handleAddCategory} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Add</button>
                        </div>
                    </div>
                </Modal>
            )}
            {showAddItemModal && (
                <Modal onClose={() => setShowAddItemModal(false)}>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Add New Item to "{targetCategory}"</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newItemName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                                <input type="text" id="newItemName" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g., Soda" className={inputStyles} />
                            </div>
                            <div>
                                <label htmlFor="newItemDefault" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Pre-fill Amount</label>
                                <input type="number" id="newItemDefault" value={newItem.defaultValue === 0 ? '' : newItem.defaultValue} onChange={e => setNewItem({...newItem, defaultValue: parseFloat(e.target.value) || 0})} placeholder="0" className={inputStyles} />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowAddItemModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                            <button onClick={handleAddItem} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Add</button>
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
                            Are you sure you want to permanently delete <br/> <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteConfirmation.itemName || deleteConfirmation.catName}</span>?
                            {deleteConfirmation.type === 'category' && <span className="block text-sm mt-1 text-amber-600">This will also delete all items within this category.</span>}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button type="button" onClick={() => setDeleteConfirmation(null)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button type="button" onClick={confirmDeletion} className="px-5 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm transition-colors">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
            {showImportConfirmModal && structureToImport && (
                <Modal onClose={cancelImport}>
                    <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-lg">
                        <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Confirm Structure Import</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                            This will replace your current expense structure with the data from the imported file.
                        </p>
                        <p className="text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md mt-4 text-sm">
                            This change is temporary. You must click "Save Changes" to make it permanent.
                        </p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button onClick={cancelImport} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                            <button onClick={confirmImport} className="px-6 py-2 bg-secondary text-white rounded-md hover:bg-primary">Confirm & Load</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ExpenseStructureManager;