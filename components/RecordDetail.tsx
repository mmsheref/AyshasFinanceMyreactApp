import React, { useState, useEffect } from 'react';
import { DailyRecord } from '../types';
import { DeleteIcon, EditIcon, EyeIcon, ShareIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Modal from './Modal';
import { shareImageFile } from '../utils/capacitor-utils';
import ShareableReport from './ShareableReport';

declare var html2canvas: any;

interface RecordDetailProps {
  record: DailyRecord;
  onDelete: (id: string) => void;
  onEdit: (record: DailyRecord) => void;
}

const RecordDetail: React.FC<RecordDetailProps> = ({ record, onDelete, onEdit }) => {
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);

  const totalExpenses = record.expenses.reduce((total, category) =>
    total + category.items.reduce((catTotal, item) => catTotal + item.amount, 0),
    0
  );
  const profit = record.totalSales - totalExpenses;

  const handleShare = async () => {
    setIsSharing(true);
    setIsPreparingShare(true);
  };

  const openPhotoViewer = (photos: string[], startIndex: number) => {
    setViewingPhotos(photos);
    setCurrentPhotoIndex(startIndex);
  };

  const closePhotoViewer = () => {
    setViewingPhotos(null);
  };

  useEffect(() => {
    if (!isPreparingShare) return;

    const generateAndShareImage = async () => {
      // Allow React to render the hidden component
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const elementToCapture = document.getElementById('share-report-source');
      if (!elementToCapture) {
        alert('Failed to prepare report for sharing.');
        setIsSharing(false);
        setIsPreparingShare(false);
        return;
      }

      try {
        const canvas = await html2canvas(elementToCapture, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const base64Data = canvas.toDataURL('image/png');
        const fileName = `Ayshas-Report-${record.date}.png`;
        const title = `P&L Report for ${record.date}`;
        const text = `Report for ${new Date(record.date).toLocaleDateString('en-GB')}`;
        
        await shareImageFile(fileName, base64Data, title, text);

      } catch (error) {
        console.error('Error sharing report:', error);
        alert('An error occurred while sharing.');
      } finally {
        setIsSharing(false);
        setIsPreparingShare(false);
      }
    };

    generateAndShareImage();

  }, [isPreparingShare, record]);

  return (
    <div className="space-y-6">
      {isPreparingShare && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
          <ShareableReport record={record} id="share-report-source" />
        </div>
      )}

      <div id="report-container" className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm">
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Report for</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Sales</p>
                <p className="text-2xl font-bold text-primary">₹{record.totalSales.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Expenses</p>
                <p className="text-2xl font-bold text-error">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{profit >= 0 ? 'Total Profit' : 'Total Loss'}</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-error'}`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
            </div>
        </div>

        {/* Expense Details */}
        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">Expense Breakdown</h3>
          {record.expenses.map(category => {
             const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
             if (categoryTotal === 0) return null;
             return (
                <div key={category.id} className="border border-slate-200 dark:border-slate-800 rounded-lg">
                    <h4 className="text-md font-semibold text-primary bg-primary/5 dark:bg-primary/10 p-3 flex justify-between rounded-t-lg">
                        <span>{category.name}</span>
                        <span>₹{categoryTotal.toLocaleString('en-IN')}</span>
                    </h4>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {category.items.map(item => item.amount > 0 && (
                            <li key={item.id} className="px-3 py-2 flex justify-between items-center text-sm">
                                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                <div className="flex items-center space-x-3">
                                    {(item.billPhotos && item.billPhotos.length > 0) && (
                                        <button onClick={() => openPhotoViewer(item.billPhotos!, 0)} className="relative text-blue-500 hover:text-blue-700" aria-label="View bill photos">
                                            <EyeIcon className="w-5 h-5" />
                                            {item.billPhotos.length > 1 && (
                                                <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{item.billPhotos.length}</span>
                                            )}
                                        </button>
                                    )}
                                    <span className="font-medium text-slate-800 dark:text-slate-200 w-20 text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
             );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm flex justify-around items-center no-capture">
        <button onClick={handleShare} disabled={isSharing} className="flex flex-col items-center text-slate-600 dark:text-slate-300 hover:text-primary transition-colors disabled:opacity-50 w-24 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Share report">
            <ShareIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">{isSharing ? 'Sharing...' : 'Share'}</span>
        </button>
        <button onClick={() => onEdit(record)} className="flex flex-col items-center text-slate-600 dark:text-slate-300 hover:text-primary transition-colors w-24 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit record">
            <EditIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">Edit</span>
        </button>
        <button onClick={() => onDelete(record.id)} className="flex flex-col items-center text-slate-600 dark:text-slate-300 hover:text-error transition-colors w-24 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Delete record">
            <DeleteIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {viewingPhotos && (
        <Modal onClose={closePhotoViewer}>
            <div className="relative">
                <img src={viewingPhotos[currentPhotoIndex]} alt={`Bill ${currentPhotoIndex + 1} of ${viewingPhotos.length}`} className="max-w-full max-h-[80vh] rounded-lg" />
                {viewingPhotos.length > 1 && (
                    <>
                        <button 
                            onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + viewingPhotos.length) % viewingPhotos.length)} 
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % viewingPhotos.length)} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Next image"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs rounded-full px-2 py-1">
                            {currentPhotoIndex + 1} / {viewingPhotos.length}
                        </div>
                    </>
                )}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default RecordDetail;