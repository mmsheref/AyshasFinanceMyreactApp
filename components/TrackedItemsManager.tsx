
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from './Modal';
import { SearchIcon, ChevronDownIcon } from './Icons';

interface TrackedItemsManagerProps {
    onClose: () => void;
}

const TrackedItemsManager: React.FC<TrackedItemsManagerProps> = ({ onClose }) => {
    const { customStructure, trackedItems, handleUpdateTrackedItems } = useAppContext();
    const [internalSelection, setInternalSelection] = useState<string[]>(trackedItems);
    const [searchTerm, setSearchTerm] = useState('');
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const toggleItem = (itemName: string) => {
        setInternalSelection(prev => 
            prev.includes(itemName) 
                ? prev.filter(i => i !== itemName) 
                : [...prev, itemName]
        );
    };

    const handleSave = async () => {
        await handleUpdateTrackedItems(internalSelection);
        onClose();
    };

    const toggleCategory = (catName: string) => {
        setOpenCategories(prev => 
            prev.includes(catName) 
                ? prev.filter(c => c !== catName) 
                : [...prev, catName]
        );
    };

    const sortedCategories = Object.keys(customStructure).sort();
    const isSearching = searchTerm.trim().length > 0;

    return (
        <Modal onClose={onClose}>
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[90vh] flex flex-col p-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark mb-1">Inventory Watch</h2>
                <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark mb-4">Select items to track last purchase date.</p>
                
                {/* Search */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-container-high dark:bg-surface-dark-container-high rounded-full border-none text-sm text-surface-on dark:text-surface-on-dark placeholder-surface-on-variant dark:placeholder-surface-on-variant-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark outline-none"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark" />
                </div>

                <div className="flex-grow overflow-y-auto space-y-2 mb-6">
                    {sortedCategories.map(catName => {
                        const items = customStructure[catName];
                        const filteredItems = isSearching 
                            ? items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            : items;

                        if (filteredItems.length === 0) return null;

                        const isOpen = openCategories.includes(catName) || isSearching;

                        return (
                            <div key={catName} className="bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl overflow-hidden">
                                <button 
                                    onClick={() => toggleCategory(catName)}
                                    disabled={isSearching}
                                    className="w-full flex items-center justify-between p-3 text-left disabled:cursor-default"
                                >
                                    <span className="font-semibold text-primary dark:text-primary-dark">{catName}</span>
                                    {!isSearching && (
                                        <ChevronDownIcon className={`w-4 h-4 text-surface-on-variant dark:text-surface-on-variant-dark transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                                
                                {isOpen && (
                                    <div className="px-3 pb-3 space-y-1">
                                        {filteredItems.map(item => (
                                            <label key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-highest/50 dark:hover:bg-surface-dark-container-highest/50 cursor-pointer">
                                                <span className="text-sm text-surface-on dark:text-surface-on-dark">{item.name}</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={internalSelection.includes(item.name)} 
                                                    onChange={() => toggleItem(item.name)} 
                                                    className="w-5 h-5 text-primary dark:text-primary-dark border-surface-outline dark:border-surface-outline-dark rounded focus:ring-primary bg-transparent"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isSearching && Object.keys(customStructure).every(cat => customStructure[cat].filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
                        <div className="text-center py-8 text-surface-on-variant dark:text-surface-on-variant-dark">No items found.</div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-outline/10 dark:border-surface-outline-dark/10">
                    <button onClick={onClose} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/10 dark:hover:bg-primary-container-dark/10 rounded-full">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium shadow-sm">Save</button>
                </div>
            </div>
        </Modal>
    );
};

export default TrackedItemsManager;
