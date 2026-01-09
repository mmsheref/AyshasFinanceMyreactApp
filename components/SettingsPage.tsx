
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackupRestore from './BackupRestore';
import { useAppContext } from '../context/AppContext';
import ExpenseStructureManager from './ExpenseStructureManager';
import TrackedItemsManager from './TrackedItemsManager';
import { DatabaseIcon, PaintBrushIcon, InformationCircleIcon, ChevronRightIcon, XMarkIcon, CodeBracketIcon, TagIcon, AdjustmentsHorizontalIcon, SparklesIcon, CalendarIcon, ClockIcon, FireIcon } from './Icons';
import Modal from './Modal';
import { ReportMetric, ReportCardVisibilitySettings, CustomExpenseStructure, GasConfig } from '../types';
import { METRIC_LABELS } from '../constants';

interface SettingsItemProps {
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    children?: React.ReactNode, 
    onClick?: () => void 
}

const SettingsGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2 mb-6">
    <h2 className="px-4 text-sm font-medium text-primary dark:text-primary-dark uppercase tracking-wide">{title}</h2>
    <div className="bg-surface-container dark:bg-surface-dark-container border border-surface-outline/10 dark:border-surface-outline-dark/10 rounded-[24px] overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, description, children, onClick }) => {
  const content = (
    <div className="flex items-center p-4 min-h-[72px]">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on-variant dark:text-surface-on-variant-dark mr-4">
          {icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-base font-normal text-surface-on dark:text-surface-on-dark">{title}</h3>
        <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-0.5 leading-snug">{description}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
      {onClick && <ChevronRightIcon className="w-5 h-5 text-surface-outline dark:text-surface-outline-dark ml-2" />}
    </div>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left active:bg-surface-variant/30 transition-colors border-b border-surface-outline/5 dark:border-surface-outline-dark/5 last:border-b-0">
          {content}
      </button>
    );
  }
  return <div className="border-b border-surface-outline/5 dark:border-surface-outline-dark/5 last:border-b-0">{content}</div>;
};

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useAppContext();
    const options: { label: string, value: 'light' | 'dark' | 'system' }[] = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Auto', value: 'system' },
    ];
    return (
        <div className="flex items-center bg-surface-container-high dark:bg-surface-dark-container-high rounded-full p-1">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all ${
                        theme === option.value
                            ? 'bg-surface dark:bg-surface-dark text-surface-on dark:text-surface-on-dark shadow-sm'
                            : 'text-surface-on-variant dark:text-surface-on-variant-dark'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

const Switch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`${
                checked ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark' : 'bg-surface-variant dark:bg-surface-dark-container-high border-surface-outline dark:border-surface-outline-dark'
            } relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none`}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-6 bg-white dark:bg-surface-dark-container-low' : 'translate-x-0 bg-surface-outline dark:bg-surface-outline-dark'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out mt-[1px] ml-[1px]`}
            />
        </button>
    );
};

const YearPicker: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { availableYears, activeYear, setActiveYear } = useAppContext();
    
    const handleSelect = async (year: string) => {
        await setActiveYear(year);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] p-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark mb-4">Select Fiscal Year</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    <button 
                        onClick={() => handleSelect('all')}
                        className={`w-full text-left p-4 rounded-xl transition-colors ${activeYear === 'all' ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' : 'bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark'}`}
                    >
                        <p className="font-bold">All Records</p>
                        <p className="text-xs opacity-70">View all financial history</p>
                    </button>
                    {availableYears.map(year => (
                        <button 
                            key={year}
                            onClick={() => handleSelect(year)}
                            className={`w-full text-left p-4 rounded-xl transition-colors ${activeYear === year ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' : 'bg-surface-container-high dark:bg-surface-dark-container-high text-surface-on dark:text-surface-on-dark'}`}
                        >
                            <p className="font-bold">{year}</p>
                            <p className="text-xs opacity-70">Fiscal year {year}</p>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

const FoodCostCategoryManager: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { foodCostCategories, customStructure, handleUpdateFoodCostCategories } = useAppContext();
    const [internalSelection, setInternalSelection] = useState<string[]>(foodCostCategories);
    const allCategories = Object.keys(customStructure);
    const handleToggleCategory = (categoryName: string) => {
        setInternalSelection(prev => prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]);
    };
    const handleSave = async () => { await handleUpdateFoodCostCategories(internalSelection); onClose(); };

    return (
        <Modal onClose={onClose}>
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[90vh] flex flex-col p-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark mb-4">Food Cost Categories</h2>
                <div className="flex-grow overflow-y-auto space-y-2 mb-6">
                    {allCategories.map(catName => (
                        <label key={catName} className="flex items-center justify-between p-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl cursor-pointer">
                            <span className="font-medium text-surface-on dark:text-surface-on-dark">{catName}</span>
                             <input type="checkbox" checked={internalSelection.includes(catName)} onChange={() => handleToggleCategory(catName)} className="w-5 h-5 text-primary dark:text-primary-dark border-surface-outline dark:border-surface-outline-dark rounded focus:ring-primary bg-transparent"/>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/10 dark:hover:bg-primary-container-dark/10 rounded-full">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium">Save</button>
                </div>
            </div>
        </Modal>
    );
};

const ReportCardManager: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { reportCardVisibility, handleUpdateReportCardVisibility } = useAppContext();
    const [internalVisibility, setInternalVisibility] = useState<ReportCardVisibilitySettings>(reportCardVisibility);
    const handleToggle = (metric: ReportMetric) => { setInternalVisibility(prev => ({ ...prev, [metric]: !prev[metric] })); };
    const handleSave = async () => { await handleUpdateReportCardVisibility(internalVisibility); onClose(); };
    const allMetrics = Object.keys(METRIC_LABELS) as ReportMetric[];

    return (
         <Modal onClose={onClose}>
            <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[90vh] flex flex-col p-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark mb-4">Report Cards</h2>
                <div className="flex-grow overflow-y-auto space-y-2 mb-6">
                    {allMetrics.map(metric => (
                        <div key={metric} className="flex items-center justify-between p-3 bg-surface-container-high dark:bg-surface-dark-container-high rounded-xl">
                            <span className="text-sm font-medium text-surface-on dark:text-surface-on-dark">{METRIC_LABELS[metric]}</span>
                            <Switch checked={internalVisibility[metric]} onChange={() => handleToggle(metric)} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/10 dark:hover:bg-primary-container-dark/10 rounded-full">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium">Save</button>
                </div>
            </div>
        </Modal>
    );
};

const GasConfigManager: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { gasConfig, handleUpdateGasConfig } = useAppContext();
    const [localConfig, setLocalConfig] = useState<GasConfig>(gasConfig);
    
    const handleSave = async () => {
        await handleUpdateGasConfig(localConfig);
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-surface-outline/50 dark:border-surface-outline-dark/50 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 dark:bg-surface-dark-container-high dark:text-surface-on-dark transition";

    return (
        <Modal onClose={onClose}>
             <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[90vh] flex flex-col p-6">
                <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark mb-6">Gas Configuration</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Total Cylinders Owned</label>
                        <input 
                            type="number" 
                            value={localConfig.totalCylinders || 0} 
                            onChange={(e) => setLocalConfig({...localConfig, totalCylinders: parseInt(e.target.value) || 0})}
                            className={inputStyles}
                        />
                        <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-1">
                            Total cylinders you own (Active + Full + Empty).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Current Stock (Full)</label>
                        <input 
                            type="number" 
                            value={localConfig.currentStock} 
                            onChange={(e) => setLocalConfig({...localConfig, currentStock: parseInt(e.target.value) || 0})}
                            className={inputStyles}
                        />
                        <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-1">Number of full cylinders currently in inventory.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark mb-1">Active Connections</label>
                        <input 
                            type="number" 
                            value={localConfig.cylindersPerBank} 
                            onChange={(e) => setLocalConfig({...localConfig, cylindersPerBank: parseInt(e.target.value) || 0})}
                            className={inputStyles}
                        />
                         <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-1">Number of cylinders connected to the stove (Active).</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-8">
                    <button onClick={onClose} className="px-4 py-2 text-primary dark:text-primary-dark font-medium hover:bg-primary-container/10 dark:hover:bg-primary-container-dark/10 rounded-full">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-medium">Save</button>
                </div>
            </div>
        </Modal>
    );
};

const SettingsPage: React.FC = () => {
    const { 
        records, 
        customStructure, 
        activeYear, 
        billUploadCategories, 
        handleRestore, 
        handleUpdateStructure, 
        handleUpdateBillUploadCategories 
    } = useAppContext();
    const navigate = useNavigate();
    const [isStructureModalOpen, setStructureModalOpen] = useState(false);
    const [isFoodCostModalOpen, setFoodCostModalOpen] = useState(false);
    const [isReportCardModalOpen, setReportCardModalOpen] = useState(false);
    const [isTrackedItemsModalOpen, setTrackedItemsModalOpen] = useState(false);
    const [isGasConfigModalOpen, setGasConfigModalOpen] = useState(false);
    const [isAboutModalOpen, setAboutModalOpen] = useState(false);
    const [isYearModalOpen, setYearModalOpen] = useState(false);

    const handleStructureSave = async (newStructure: CustomExpenseStructure, newBillFlags: string[]) => {
        await handleUpdateStructure(newStructure);
        await handleUpdateBillUploadCategories(newBillFlags);
        alert("Settings saved successfully!");
    };

    return (
        <div className="pb-10 pt-4">
            <SettingsGroup title="General">
                <SettingsItem icon={<CalendarIcon className="w-5 h-5"/>} title="Reporting Period" description={activeYear === 'all' ? 'Showing all records' : `Active Fiscal Year: ${activeYear}`} onClick={() => setYearModalOpen(true)} />
                <SettingsItem icon={<PaintBrushIcon className="w-5 h-5"/>} title="Theme" description="Appearance">
                    <ThemeSwitcher />
                </SettingsItem>
            </SettingsGroup>

            <SettingsGroup title="Data Management">
                <SettingsItem icon={<DatabaseIcon className="w-5 h-5"/>} title="Backup & Restore" description="Export or import your data">
                    <div className="mt-2">
                         <BackupRestore allRecords={records} customStructure={customStructure} onRestore={handleRestore} />
                    </div>
                </SettingsItem>
                <SettingsItem icon={<CodeBracketIcon className="w-5 h-5"/>} title="Expense Structure" description="Customize categories & items" onClick={() => setStructureModalOpen(true)} />
            </SettingsGroup>
            
            <SettingsGroup title="Analytics Config">
                 <SettingsItem icon={<ClockIcon className="w-5 h-5"/>} title="Inventory Watch" description="Select items to track last purchase" onClick={() => setTrackedItemsModalOpen(true)} />
                 <SettingsItem icon={<FireIcon className="w-5 h-5"/>} title="Gas Configuration" description="Manage stock & capacity" onClick={() => setGasConfigModalOpen(true)} />
                 <SettingsItem icon={<TagIcon className="w-5 h-5"/>} title="Food Cost Categories" description="Select categories for cost analysis" onClick={() => setFoodCostModalOpen(true)} />
                 <SettingsItem icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} title="Report Cards" description="Toggle visibility of KPI cards" onClick={() => setReportCardModalOpen(true)} />
            </SettingsGroup>

            <SettingsGroup title="App Info">
                <SettingsItem icon={<InformationCircleIcon className="w-5 h-5"/>} title="About" description="Version 2.3.0 • Credits" onClick={() => setAboutModalOpen(true)} />
            </SettingsGroup>
            
            {isStructureModalOpen && (
                <Modal onClose={() => setStructureModalOpen(false)} size="large">
                    <div className="bg-surface-container dark:bg-surface-dark-container rounded-[28px] max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-surface-outline/10 dark:border-surface-outline-dark/10 flex justify-between items-center">
                            <h2 className="text-xl font-medium text-surface-on dark:text-surface-on-dark">Expense Structure</h2>
                            <button onClick={() => setStructureModalOpen(false)} className="p-2 rounded-full hover:bg-surface-variant/30">
                                <XMarkIcon className="w-6 h-6 text-surface-on-variant dark:text-surface-on-variant-dark" />
                            </button>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto">
                           <ExpenseStructureManager 
                                structure={customStructure} 
                                onSave={handleStructureSave} 
                                initialBillUploadCategories={billUploadCategories}
                           />
                        </div>
                    </div>
                </Modal>
            )}

            {isYearModalOpen && <YearPicker onClose={() => setYearModalOpen(false)} />}
            {isFoodCostModalOpen && <FoodCostCategoryManager onClose={() => setFoodCostModalOpen(false)} />}
            {isReportCardModalOpen && <ReportCardManager onClose={() => setReportCardModalOpen(false)} />}
            {isTrackedItemsModalOpen && <TrackedItemsManager onClose={() => setTrackedItemsModalOpen(false)} />}
            {isGasConfigModalOpen && <GasConfigManager onClose={() => setGasConfigModalOpen(false)} />}
            
            {isAboutModalOpen && (
                <Modal onClose={() => setAboutModalOpen(false)}>
                    <div className="p-8 bg-surface-container dark:bg-surface-dark-container rounded-[28px] text-center">
                        <div className="w-20 h-20 mx-auto bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark rounded-[20px] flex items-center justify-center mb-6 shadow-elevation-1">
                            <SparklesIcon className="w-10 h-10" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-surface-on dark:text-surface-on-dark mb-1">Ayshas Finance Tracker</h2>
                        <p className="text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark bg-surface-container-high dark:bg-surface-dark-container-high py-1 px-3 rounded-full inline-block mb-8">
                            Version 2.3.0
                        </p>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-surface-on-variant dark:text-surface-on-variant-dark uppercase tracking-widest mb-2">Developed By</p>
                                <div className="p-4 bg-surface-container-high dark:bg-surface-dark-container-high rounded-2xl border border-surface-outline/5 dark:border-surface-outline-dark/5">
                                    <p className="text-xl font-bold text-primary dark:text-primary-dark">Ameer</p>
                                    <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark mt-1">Lead Developer & Designer</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-surface-outline/10 dark:border-surface-outline-dark/10">
                            <p className="text-xs text-surface-on-variant dark:text-surface-on-variant-dark">
                                Built with React, Capacitor & Material Design 3
                            </p>
                        </div>

                        <button 
                            onClick={() => setAboutModalOpen(false)} 
                            className="mt-8 w-full py-3.5 bg-primary dark:bg-primary-dark text-primary-on dark:text-primary-on-dark rounded-full font-bold shadow-sm active:scale-[0.98] transition-transform"
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SettingsPage;
