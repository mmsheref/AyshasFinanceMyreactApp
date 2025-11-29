import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackupRestore from './BackupRestore';
import { useAppContext } from '../context/AppContext';
import ExpenseStructureManager from './ExpenseStructureManager';
import { DatabaseIcon, PaintBrushIcon, InformationCircleIcon, ChevronRightIcon, XMarkIcon, CodeBracketIcon, TagIcon, AdjustmentsHorizontalIcon } from './Icons';
import Modal from './Modal';
import { ReportMetric, ReportCardVisibilitySettings, CustomExpenseStructure } from '../types';
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

const SettingsPage: React.FC = () => {
    const { records, customStructure, handleRestore, handleUpdateStructure } = useAppContext();
    const navigate = useNavigate();
    const [isStructureModalOpen, setStructureModalOpen] = useState(false);
    const [isFoodCostModalOpen, setFoodCostModalOpen] = useState(false);
    const [isReportCardModalOpen, setReportCardModalOpen] = useState(false);

    const onStructureUpdate = async (newStructure: CustomExpenseStructure) => {
        await handleUpdateStructure(newStructure);
        alert("Expense structure updated successfully!");
    };

    return (
        <div className="pb-10 pt-4">
             {/* Large Header */}
            <div className="mb-6">
                <h1 className="text-[32px] leading-tight font-normal text-surface-on dark:text-surface-on-dark">Settings</h1>
            </div>

            <SettingsGroup title="General">
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
                 <SettingsItem icon={<TagIcon className="w-5 h-5"/>} title="Food Cost Categories" description="Select categories for cost analysis" onClick={() => setFoodCostModalOpen(true)} />
                 <SettingsItem icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} title="Report Cards" description="Toggle visibility of KPI cards" onClick={() => setReportCardModalOpen(true)} />
            </SettingsGroup>

            <SettingsGroup title="App Info">
                <SettingsItem icon={<InformationCircleIcon className="w-5 h-5"/>} title="About" description="Version 2.2.0 (Material Design 3)" onClick={() => navigate('/onboarding-rerun')} />
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
                           <ExpenseStructureManager structure={customStructure} onUpdate={onStructureUpdate} />
                        </div>
                    </div>
                </Modal>
            )}

            {isFoodCostModalOpen && <FoodCostCategoryManager onClose={() => setFoodCostModalOpen(false)} />}
            {isReportCardModalOpen && <ReportCardManager onClose={() => setReportCardModalOpen(false)} />}
        </div>
    );
};

export default SettingsPage;