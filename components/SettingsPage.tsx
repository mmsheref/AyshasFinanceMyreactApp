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
  <div className="space-y-3">
    <h2 className="px-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h2>
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
      {children}
    </div>
  </div>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, description, children, onClick }) => {
  const content = (
    <div className="flex items-start p-4 space-x-4">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary mt-0.5">{icon}</div>
      <div className="flex-grow">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
      {onClick && <div className="flex-shrink-0 self-center"><ChevronRightIcon className="w-5 h-5 text-slate-400" /></div>}
    </div>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl">{content}</button>
    );
  }
  return <div className="first:rounded-t-xl last:rounded-b-xl">{content}</div>;
};

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useAppContext();
    const options: { label: string, value: 'light' | 'dark' | 'system' }[] = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
    ];
    return (
        <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all w-full ${
                        theme === option.value
                            ? 'bg-white dark:bg-slate-950 text-primary shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

const FoodCostCategoryManager: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { foodCostCategories, customStructure, handleUpdateFoodCostCategories } = useAppContext();
    const [internalSelection, setInternalSelection] = useState<string[]>(foodCostCategories);

    const allCategories = Object.keys(customStructure);

    const handleToggleCategory = (categoryName: string) => {
        setInternalSelection(prev => 
            prev.includes(categoryName) 
            ? prev.filter(c => c !== categoryName)
            : [...prev, categoryName]
        );
    };

    const handleSave = async () => {
        await handleUpdateFoodCostCategories(internalSelection);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Food Cost Categories</h2>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Select which expense categories should be included in the "Food Cost %" and "Prime Cost %" calculations in your reports.
                    </p>
                    <div className="space-y-2">
                        {allCategories.map(catName => (
                            <label key={catName} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={internalSelection.includes(catName)}
                                    onChange={() => handleToggleCategory(catName)}
                                    className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
                                />
                                <span className="ml-3 font-medium text-slate-800 dark:text-slate-200">{catName}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Save</button>
                </div>
            </div>
        </Modal>
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
                checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:ring-offset-slate-900`}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};

const ReportCardManager: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { reportCardVisibility, handleUpdateReportCardVisibility } = useAppContext();
    const [internalVisibility, setInternalVisibility] = useState<ReportCardVisibilitySettings>(reportCardVisibility);

    const handleToggle = (metric: ReportMetric) => {
        setInternalVisibility(prev => ({
            ...prev,
            [metric]: !prev[metric],
        }));
    };

    const handleSave = async () => {
        await handleUpdateReportCardVisibility(internalVisibility);
        onClose();
    };

    const allMetrics = Object.keys(METRIC_LABELS) as ReportMetric[];

    return (
         <Modal onClose={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Customize Report Cards</h2>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                       Use the toggles to show or hide specific metric cards on the Reports page.
                    </p>
                    <div className="space-y-2">
                        {allMetrics.map(metric => (
                            <div key={metric} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{METRIC_LABELS[metric]}</span>
                                <Switch
                                    checked={internalVisibility[metric]}
                                    onChange={() => handleToggle(metric)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">Save</button>
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
        <div className="space-y-6">
            <SettingsGroup title="Data & Backup">
                <SettingsItem icon={<DatabaseIcon className="w-5 h-5"/>} title="Backup & Restore" description="Export all your data to a file for safekeeping, or import a previous backup.">
                    <BackupRestore allRecords={records} customStructure={customStructure} onRestore={handleRestore} />
                </SettingsItem>
            </SettingsGroup>

            <SettingsGroup title="Customization">
                <SettingsItem icon={<PaintBrushIcon className="w-5 h-5"/>} title="Theme" description="Choose your preferred color scheme for the app.">
                    <ThemeSwitcher />
                </SettingsItem>
                 <SettingsItem icon={<CodeBracketIcon className="w-5 h-5"/>} title="Manage Expense Structure" description="Add, remove, or edit expense categories and items to perfectly match your business." onClick={() => setStructureModalOpen(true)} />
                 <SettingsItem icon={<TagIcon className="w-5 h-5"/>} title="Manage Food Cost Categories" description="Choose which categories are included in your Food Cost % and Prime Cost % calculations." onClick={() => setFoodCostModalOpen(true)} />
                 <SettingsItem icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>} title="Customize Report Cards" description="Show or hide specific KPI cards on the Reports page to focus on what matters to you." onClick={() => setReportCardModalOpen(true)} />
            </SettingsGroup>

            <SettingsGroup title="About">
                <SettingsItem icon={<InformationCircleIcon className="w-5 h-5"/>} title="About Aysha's P&L" description="Version 2.2.0 - A simple P&L tracker." onClick={() => navigate('/onboarding-rerun')} />
            </SettingsGroup>
            
            {isStructureModalOpen && (
                <Modal onClose={() => setStructureModalOpen(false)} size="large">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-h-[90vh] flex flex-col">
                        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Expense Structure</h2>
                            <button onClick={() => setStructureModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
                                <XMarkIcon className="w-6 h-6 text-slate-500" />
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