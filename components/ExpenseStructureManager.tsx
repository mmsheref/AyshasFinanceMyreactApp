
import React, { useState } from 'react';
import { CustomExpenseStructure } from '../types';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, DragHandleIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface ExpenseStructureManagerProps {
    structure: CustomExpenseStructure;
    onSave: (newStructure: CustomExpenseStructure, newBillFlags: string[]) => void;
    initialBillUploadCategories: string[];
}

interface DragItemState {
    type: 'category' | 'item';
    catName: string;
    index: number;
}

const ExpenseStructureManager: React.FC<ExpenseStructureManagerProps> = ({ structure, onSave, initialBillUploadCategories }) => {
    // Deep copy for local state
    const [internalStructure, setInternalStructure] = useState<CustomExpenseStructure>(JSON.parse(JSON.stringify(structure)));
    const [billFlags, setBillFlags] = useState<string[]>(initialBillUploadCategories);
    
    // UI State
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newItemNames, setNewItemNames] = useState<{ [category: string]: string }>({});
    
    // Drag & Drop State
    const [dragItem, setDragItem] = useState<DragItemState | null>(null);
    const [dragOverInfo, setDragOverInfo] = useState<{ type: 'category' | 'item', index: number, catName?: string } | null>(null);
    
    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'category' | 'item', catName: string, itemName?: string } | null>(null);

    const toggleCategory = (catName: string) => {
        setOpenCategories(prev => 
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        if (internalStructure[newCategoryName.trim()]) {
            alert('Category already exists');
            return;
        }
        setInternalStructure(prev => ({ ...prev, [newCategoryName.trim()]: [] }));
        setNewCategoryName('');
    };

    const handleDeleteCategory = (catName: string) => {
        const newStruct = { ...internalStructure };
        delete newStruct[catName];
        setInternalStructure(newStruct);
        setBillFlags(prev => prev.filter(c => c !== catName));
        setDeleteConfirmation(null);
    };

    const handleAddItem = (catName: string) => {
        const itemName = newItemNames[catName]?.trim();
        if (!itemName) return;
        
        const currentItems = internalStructure[catName];
        if (currentItems.some(i => i.name === itemName)) {
            alert('Item already exists in this category');
            return;
        }

        setInternalStructure(prev => ({
            ...prev,
            [catName]: [...prev[catName], { name: itemName, defaultValue: 0 }]
        }));
        setNewItemNames(prev => ({ ...prev, [catName]: '' }));
    };

    const handleDeleteItem = (catName: string, itemName: string) => {
        setInternalStructure(prev => ({
            ...prev,
            [catName]: prev[catName].filter(i => i.name !== itemName)
        }));
        setDeleteConfirmation(null);
    };
    
    const toggleBillUpload = (catName: string) => {
        setBillFlags(prev => 
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };

    const saveChanges = () => {
        onSave(internalStructure, billFlags);
    };

    // --- Reorder Helpers (Manual Arrows) ---
    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const keys = Object.keys(internalStructure);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= keys.length) return;

        const newKeys = [...keys];
        const [movedKey] = newKeys.splice(index, 1);
        newKeys.splice(newIndex, 0, movedKey);

        const newStruct: CustomExpenseStructure = {};
        newKeys.forEach(k => newStruct[k] = internalStructure[k]);
        setInternalStructure(newStruct);
    };

    const moveItem = (catName: string, index: number, direction: 'up' | 'down') => {
        const items = [...internalStructure[catName]];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;

        const [movedItem] = items.splice(index, 1);
        items.splice(newIndex, 0, movedItem);

        setInternalStructure(prev => ({
            ...prev,
            [catName]: items
        }));
    };

    // --- DnD Handlers ---
    const handleDragStartCategory = (e: React.DragEvent, index: number, catName: string) => {
        setDragItem({ type: 'category', catName, index });
        e.dataTransfer.effectAllowed = 'move';
        const card = e.currentTarget.closest('[data-category-card]');
        if (card) e.dataTransfer.setDragImage(card, 0, 0);
    };

    const handleDragEnd = () => {
        setDragItem(null);
        setDragOverInfo(null);
    };

    const handleDragOverCategory = (e: React.DragEvent, index: number) => {
        e.preventDefault(); 
        if (dragItem?.type !== 'category') return;
        setDragOverInfo({ type: 'category', index });
    };

    const handleDropCategory = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (dragItem?.type !== 'category') return;

        const keys = Object.keys(internalStructure);
        const draggedKey = keys[dragItem.index];
        const newKeys = [...keys];
        newKeys.splice(dragItem.index, 1);
        newKeys.splice(dropIndex, 0, draggedKey);
        
        const newStruct: CustomExpenseStructure = {};
        newKeys.forEach(k => newStruct[k] = internalStructure[k]);
        setInternalStructure(newStruct);
        handleDragEnd();
    };

    const handleDragStartItem = (e: React.DragEvent, catName: string, index: number) => {
        e.stopPropagation();
        setDragItem({ type: 'item', catName, index });
        e.dataTransfer.effectAllowed = 'move';
        const row = e.currentTarget.closest('[data-item-row]');
        if (row) e.dataTransfer.setDragImage(row, 0, 0);
    };

    const handleDragOverItem = (e: React.DragEvent, catName: string, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragItem?.type !== 'item' || dragItem.catName !== catName) return;
        setDragOverInfo({ type: 'item', index, catName });
    };

    const handleDropItem = (e: React.DragEvent, catName: string, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragItem?.type !== 'item' || dragItem.catName !== catName) return;
        const items = [...internalStructure[catName]];
        const [movedItem] = items.splice(dragItem.index, 1);
        items.splice(dropIndex, 0, movedItem);
        setInternalStructure(prev => ({ ...prev, [catName]: items }));
        handleDragEnd();
    };

    const categoryKeys = Object.keys(internalStructure);

    return (
        <div className="space-y-6 pb-20">
            {/* Add Category Section */}
            <div className="bg-surface-container dark:bg-surface-dark-container p-3 rounded-[20px] flex gap-2 items-center border border-surface-outline/10 dark:border-surface-outline-dark/10">
                <input 
                    type="text" 
                    placeholder="New Category Name" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-grow px-4 py-2.5 bg-surface dark:bg-surface-dark rounded-xl text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark transition-all"
                />
                <button 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="w-11 h-11 flex items-center justify-center bg-primary dark:bg-primary-dark text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {categoryKeys.map((catName, catIndex) => {
                    const isCatDragging = dragItem?.type === 'category' && dragItem.index === catIndex;
                    const isCatDragOver = dragOverInfo?.type === 'category' && dragOverInfo.index === catIndex;
                    const isOpen = openCategories.includes(catName);

                    return (
                        <div 
                            key={catName} 
                            data-category-card
                            onDragOver={(e) => handleDragOverCategory(e, catIndex)}
                            onDrop={(e) => handleDropCategory(e, catIndex)}
                            className={`bg-surface-container-high dark:bg-surface-dark-container-high rounded-[20px] overflow-hidden border transition-all duration-200 ${
                                isCatDragOver 
                                ? 'border-primary dark:border-primary-dark ring-2 ring-primary/20 dark:ring-primary-dark/20 z-10 scale-[1.01]' 
                                : 'border-surface-outline/5 dark:border-surface-outline-dark/5'
                            } ${isCatDragging ? 'opacity-30' : ''}`}
                        >
                            {/* Category Header */}
                            <div className="flex items-center justify-between p-3 pr-2 bg-surface-container-highest/30 dark:bg-surface-dark-container-highest/30">
                                <div className="flex items-center gap-2 flex-grow overflow-hidden">
                                    <div 
                                        draggable
                                        onDragStart={(e) => handleDragStartCategory(e, catIndex, catName)}
                                        onDragEnd={handleDragEnd}
                                        className="cursor-grab active:cursor-grabbing text-surface-on-variant/50 dark:text-surface-on-variant-dark/50 hover:text-surface-on dark:hover:text-surface-on-dark p-2 rounded-lg hover:bg-surface-on/5"
                                    >
                                        <DragHandleIcon className="w-5 h-5" />
                                    </div>

                                    <button onClick={() => toggleCategory(catName)} className="flex items-center gap-2 font-bold text-surface-on dark:text-surface-on-dark text-sm flex-grow text-left truncate py-2">
                                        <div className={`p-1 rounded-full transition-transform duration-200 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-surface-on-variant'}`}>
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{catName}</span>
                                        <span className="text-xs font-normal text-surface-on-variant dark:text-surface-on-variant-dark bg-surface-on/5 px-2 py-0.5 rounded-full">
                                            {internalStructure[catName].length}
                                        </span>
                                    </button>
                                </div>

                                {/* Category Actions */}
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <div className="flex flex-col gap-px mr-1">
                                        <button onClick={() => moveCategory(catIndex, 'up')} disabled={catIndex === 0} className="p-1 text-surface-on-variant/40 hover:text-primary disabled:opacity-10"><ArrowUpIcon className="w-3 h-3" /></button>
                                        <button onClick={() => moveCategory(catIndex, 'down')} disabled={catIndex === categoryKeys.length - 1} className="p-1 text-surface-on-variant/40 hover:text-primary disabled:opacity-10"><ArrowDownIcon className="w-3 h-3" /></button>
                                    </div>
                                    <div className="w-px h-6 bg-surface-outline/10 mx-1"></div>
                                    <button onClick={() => setDeleteConfirmation({ type: 'category', catName })} className="p-2 text-surface-on-variant dark:text-surface-on-variant-dark hover:text-error dark:hover:text-error-dark transition-colors rounded-full hover:bg-error/10">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Category Content */}
                            {isOpen && (
                                <div className="px-3 pb-3 pt-1 space-y-3">
                                    {/* Items List */}
                                    <div className="space-y-2">
                                        {internalStructure[catName].map((item, itemIndex) => {
                                            const isItemDragging = dragItem?.type === 'item' && dragItem.catName === catName && dragItem.index === itemIndex;
                                            const isItemDragOver = dragOverInfo?.type === 'item' && dragOverInfo.catName === catName && dragOverInfo.index === itemIndex;

                                            return (
                                                <div 
                                                    key={item.name} 
                                                    data-item-row
                                                    onDragOver={(e) => handleDragOverItem(e, catName, itemIndex)}
                                                    onDrop={(e) => handleDropItem(e, catName, itemIndex)}
                                                    className={`group relative grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 p-2.5 rounded-xl bg-surface dark:bg-surface-dark border transition-all ${
                                                        isItemDragOver ? 'border-primary ring-1 ring-primary/20 z-10 scale-[1.01]' : 'border-surface-outline/5 dark:border-surface-outline-dark/5'
                                                    } ${isItemDragging ? 'opacity-30' : ''}`}
                                                >
                                                    {/* Drag Handle */}
                                                    <div 
                                                        draggable
                                                        onDragStart={(e) => handleDragStartItem(e, catName, itemIndex)}
                                                        onDragEnd={handleDragEnd}
                                                        className="cursor-grab active:cursor-grabbing text-surface-on-variant/30 hover:text-surface-on p-1"
                                                    >
                                                        <DragHandleIcon className="w-4 h-4" />
                                                    </div>

                                                    {/* Name */}
                                                    <span className="text-sm font-medium text-surface-on dark:text-surface-on-dark break-words leading-snug">
                                                        {item.name}
                                                    </span>
                                                    
                                                    {/* Default Value Input */}
                                                    <div className="relative w-20">
                                                        <input 
                                                            type="number" 
                                                            value={item.defaultValue || ''}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                setInternalStructure(prev => ({
                                                                    ...prev,
                                                                    [catName]: prev[catName].map(i => i.name === item.name ? { ...i, defaultValue: isNaN(val) ? 0 : val } : i)
                                                                }));
                                                            }}
                                                            className="w-full text-right text-xs p-1.5 bg-surface-container-highest/50 dark:bg-surface-dark-container-highest/50 rounded-lg outline-none focus:ring-1 focus:ring-primary text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant/30"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute left-1.5 top-1.5 text-[10px] text-surface-on-variant/50 pointer-events-none">Def</span>
                                                    </div>

                                                    {/* Move Arrows */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <button onClick={() => moveItem(catName, itemIndex, 'up')} disabled={itemIndex === 0} className="p-0.5 text-surface-on-variant/30 hover:text-primary disabled:opacity-0"><ArrowUpIcon className="w-3 h-3" /></button>
                                                        <button onClick={() => moveItem(catName, itemIndex, 'down')} disabled={itemIndex === internalStructure[catName].length - 1} className="p-0.5 text-surface-on-variant/30 hover:text-primary disabled:opacity-0"><ArrowDownIcon className="w-3 h-3" /></button>
                                                    </div>

                                                    {/* Delete */}
                                                    <button onClick={() => setDeleteConfirmation({ type: 'item', catName, itemName: item.name })} className="p-1.5 text-surface-on-variant/50 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                                        <TrashIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Item Input Section */}
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-outline/10 dark:border-surface-outline-dark/10">
                                        <div className="relative flex-grow">
                                            <input 
                                                type="text" 
                                                placeholder="New item name..." 
                                                value={newItemNames[catName] || ''}
                                                onChange={(e) => setNewItemNames(prev => ({ ...prev, [catName]: e.target.value }))}
                                                className="w-full pl-3 pr-2 py-2.5 bg-surface-container-highest dark:bg-surface-dark-container-highest rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(catName)}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleAddItem(catName)}
                                            disabled={!newItemNames[catName]?.trim()}
                                            className="px-5 py-2.5 bg-secondary-container dark:bg-secondary-container-dark text-secondary-on-container dark:text-secondary-on-container-dark rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    
                                    {/* Category Toggles */}
                                    <div className="mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface-container-highest/50">
                                            <input 
                                                type="checkbox" 
                                                checked={billFlags.includes(catName)} 
                                                onChange={() => toggleBillUpload(catName)}
                                                className="w-4 h-4 rounded text-primary dark:text-primary-dark focus:ring-primary bg-transparent border-surface-outline/30"
                                            />
                                            <span className="text-xs font-medium text-surface-on-variant dark:text-surface-on-variant-dark">Enable Bill Photo Uploads</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface dark:bg-surface-dark border-t border-surface-outline/10 dark:border-surface-outline-dark/10 flex justify-end gap-2 z-20">
                <button 
                    onClick={saveChanges}
                    className="w-full sm:w-auto px-8 py-3.5 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    Save Configuration
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface-container dark:bg-surface-dark-container rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scaleIn">
                        <h3 className="text-lg font-bold text-surface-on dark:text-surface-on-dark mb-2">Confirm Delete</h3>
                        <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark mb-6">
                            Are you sure you want to delete the {deleteConfirmation.type} 
                            <span className="font-bold text-error dark:text-error-dark"> "{deleteConfirmation.itemName || deleteConfirmation.catName}"</span>?
                            {deleteConfirmation.type === 'category' && " This will remove all items inside it."}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-5 py-2 text-sm font-bold text-surface-on-variant dark:text-surface-on-variant-dark hover:bg-surface-container-highest dark:hover:bg-surface-dark-container-highest rounded-full"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => deleteConfirmation.type === 'category' ? handleDeleteCategory(deleteConfirmation.catName) : handleDeleteItem(deleteConfirmation.catName, deleteConfirmation.itemName!)}
                                className="px-5 py-2 text-sm font-bold bg-error dark:bg-error-dark text-white rounded-full shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseStructureManager;
