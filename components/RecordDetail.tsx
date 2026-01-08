
import React, { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { DeleteIcon, EditIcon, EyeIcon, ShareIcon, ChevronLeftIcon, ChevronRightIcon, WarningIcon } from './Icons';
import Modal from './Modal';
import { shareImageFile } from '../utils/capacitor-utils';
import ShareableReport from './ShareableReport';
import { calculateTotalExpenses } from '../utils/record-utils';

declare var html2canvas: any;

const RecordDetail: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { getRecordById, handleDelete } = useAppContext();
  
  const record = useMemo(() => recordId ? getRecordById(recordId) : undefined, [recordId, getRecordById]);
  
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!isPreparingShare || !record) return;

    const generateAndShareImage = async () => {
      const wrapper = document.getElementById('share-report-wrapper');
      const elementToCapture = document.getElementById('share-report-source');

      if (!wrapper || !elementToCapture) {
        alert('Failed to prepare report for sharing.');
        setIsSharing(false);
        setIsPreparingShare(false);
        return;
      }

      try {
        // html2canvas captures the element's current state. 
        // We ensure the wrapper is hidden and not affected by the 'dark' class on <html>.
        const canvas = await html2canvas(elementToCapture, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff', // Force white background for the canvas
        });

        const base64Data = canvas.toDataURL('image/png');
        const fileName = `Ayshas-Report-${record.date}.png`;
        const title = `P&L Report for ${record.date}`;
        const text = `Report for ${new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB')}`;
        
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

  if (!record) {
    return <Navigate to="/records" replace />;
  }

  const totalExpenses = calculateTotalExpenses(record);
  const profit = record.totalSales - totalExpenses;
  const nightSales = record.totalSales - record.morningSales;

  const onConfirmDelete = async () => {
      await handleDelete(record.id);
      setIsDeleteModalOpen(false);
      navigate('/records');
  };

  const handleShare = () => {
    flushSync(() => {
      setIsSharing(true);
      setIsPreparingShare(true);
    });
  };

  const openPhotoViewer = (photos: string[], startIndex: number) => {
    setViewingPhotos(photos);
    setCurrentPhotoIndex(startIndex);
  };

  const handlePhotoNavigation = (direction: 'next' | 'prev') => {
    if (!viewingPhotos) return;
    
    setCurrentPhotoIndex(prevIndex => {
      const change = direction === 'next' ? 1 : -1;
      return (prevIndex + change + viewingPhotos.length) % viewingPhotos.length;
    });
  };
  
  return (
    <div className="space-y-6">
      {isPreparingShare && (
        <div id="share-report-wrapper" style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
          <ShareableReport record={record} id="share-report-source" />
        </div>
      )}

      <div id="report-container" className="bg-surface-container dark:bg-surface-dark-container p-4 sm:p-6 rounded-[24px] shadow-sm">
        <div className="text-center border-b border-surface-outline/10 dark:border-surface-outline-dark/10 pb-4 mb-4">
          <p className="text-sm text-surface-on-variant dark:text-surface-on-variant-dark">Report for</p>
          <h2 className="text-xl font-bold text-surface-on dark:text-surface-on-dark">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          {record.isClosed && (
               <span className="inline-block mt-2 px-3 py-1 bg-surface-container-highest dark:bg-surface-dark-container-highest rounded-full text-xs font-bold uppercase tracking-wider text-surface-on-variant dark:text-surface-on-variant-dark border border-surface-outline/20">
                   Shop Closed
               </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-surface-container-high dark:bg-surface-dark-container-high p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark">Total Sales</p>
                  <p className="text-2xl font-bold text-primary dark:text-primary-dark">₹{record.totalSales.toLocaleString('en-IN')}</p>
                </div>
                {!record.isClosed && (
                    <div className="text-xs space-y-1 text-left border-t border-surface-outline/10 dark:border-surface-outline-dark/10 pt-2 mt-2">
                        <p className="flex justify-between"><span className="text-surface-on-variant dark:text-surface-on-variant-dark">Morning:</span> <span className="font-semibold text-surface-on dark:text-surface-on-dark">₹{(record.morningSales || 0).toLocaleString('en-IN')}</span></p>
                        <p className="flex justify-between"><span className="text-surface-on-variant dark:text-surface-on-variant-dark">Night:</span> <span className="font-semibold text-surface-on dark:text-surface-on-dark">₹{nightSales.toLocaleString('en-IN')}</span></p>
                    </div>
                )}
            </div>
            <div className="bg-surface-container-high dark:bg-surface-dark-container-high p-4 rounded-xl">
                <p className="text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark">Total Expenses</p>
                <p className="text-2xl font-bold text-error dark:text-error-dark">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-surface-container-high dark:bg-surface-dark-container-high p-4 rounded-xl">
                <p className="text-sm font-medium text-surface-on-variant dark:text-surface-on-variant-dark">{profit >= 0 ? 'Total Profit' : 'Total Loss'}</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-[#006C4C] dark:text-[#6DD58C]' : 'text-error dark:text-error-dark'}`}>₹{Math.abs(profit).toLocaleString('en-IN')}</p>
            </div>
        </div>

        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-semibold text-surface-on dark:text-surface-on-dark text-center">Expense Breakdown</h3>
          {record.expenses.map(category => {
             const categoryTotal = category.items.reduce((sum, item) => sum + item.amount, 0);
             if (categoryTotal === 0) return null;
             return (
                <div key={category.id} className="border border-surface-outline/10 dark:border-surface-outline-dark/10 rounded-lg overflow-hidden">
                    <h4 className="text-md font-semibold text-primary dark:text-primary-dark bg-primary-container/30 dark:bg-primary-container-dark/30 p-3 flex justify-between">
                        <span>{category.name}</span>
                        <span>₹{categoryTotal.toLocaleString('en-IN')}</span>
                    </h4>
                    <ul className="divide-y divide-surface-outline/5 dark:divide-surface-outline-dark/5 bg-surface-container-low dark:bg-surface-dark-container-low">
                        {category.items.map(item => item.amount > 0 && (
                            <li key={item.id} className="px-3 py-2 flex justify-between items-center text-sm">
                                <span className="text-surface-on dark:text-surface-on-dark">{item.name}</span>
                                <div className="flex items-center space-x-3">
                                    {(item.billPhotos && item.billPhotos.length > 0) && (
                                        <button onClick={() => openPhotoViewer(item.billPhotos!, 0)} className="relative text-primary dark:text-primary-dark hover:text-primary/80" aria-label="View bill photos">
                                            <EyeIcon className="w-5 h-5" />
                                            {item.billPhotos.length > 1 && (
                                                <span className="absolute -top-1.5 -right-2.5 bg-secondary dark:bg-secondary-dark text-white dark:text-surface-on-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark-container-low">{item.billPhotos.length}</span>
                                            )}
                                        </button>
                                    )}
                                    <span className="font-medium text-surface-on dark:text-surface-on-dark w-20 text-right">₹{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
             );
          })}
        </div>

      </div>

      <div className="bg-surface-container dark:bg-surface-dark-container p-2 rounded-xl shadow-sm flex justify-around items-center no-capture">
        <button onClick={handleShare} disabled={isSharing} className="flex flex-col items-center text-surface-on-variant dark:text-surface-on-variant-dark hover:text-primary dark:hover:text-primary-dark transition-colors disabled:opacity-50 w-24 p-2 rounded-lg hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high" aria-label="Share report">
            <ShareIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">{isSharing ? 'Preparing...' : 'Share'}</span>
        </button>
        <button onClick={() => navigate(`/records/${record.id}/edit`)} className="flex flex-col items-center text-surface-on-variant dark:text-surface-on-variant-dark hover:text-primary dark:hover:text-primary-dark transition-colors w-24 p-2 rounded-lg hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high" aria-label="Edit record">
            <EditIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">Edit</span>
        </button>
        <button onClick={() => setIsDeleteModalOpen(true)} className="flex flex-col items-center text-surface-on-variant dark:text-surface-on-variant-dark hover:text-error dark:hover:text-error-dark transition-colors w-24 p-2 rounded-lg hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high" aria-label="Delete record">
            <DeleteIcon className="w-6 h-6 mb-1"/>
            <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {viewingPhotos && (
        <Modal onClose={() => setViewingPhotos(null)}>
            <div className="relative">
                <img src={viewingPhotos[currentPhotoIndex]} alt={`Bill ${currentPhotoIndex + 1} of ${viewingPhotos.length}`} className="max-w-full max-h-[80vh] rounded-lg" />
                {viewingPhotos.length > 1 && (
                    <>
                        <button 
                            onClick={() => handlePhotoNavigation('prev')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => handlePhotoNavigation('next')}
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

      {isDeleteModalOpen && (
        <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <div className="p-6 bg-surface-container dark:bg-surface-dark-container rounded-xl text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-container dark:bg-error-container-dark">
                    <WarningIcon className="h-6 w-6 text-error dark:text-error-dark" />
                </div>
                <h3 className="text-xl font-bold mt-4 mb-2 text-surface-on dark:text-surface-on-dark">Delete Record</h3>
                <p className="text-surface-on-variant dark:text-surface-on-variant-dark mb-6">
                    Are you sure you want to permanently delete the record for <br/>
                    <span className="font-semibold text-surface-on dark:text-surface-on-dark">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}</span>?
                </p>
                <div className="flex justify-center space-x-4">
                    <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 border border-surface-outline/30 dark:border-surface-outline-dark/30 rounded-full text-sm font-semibold text-surface-on dark:text-surface-on-dark hover:bg-surface-container-high dark:hover:bg-surface-dark-container-high transition-colors">Cancel</button>
                    <button type="button" onClick={onConfirmDelete} className="px-5 py-2.5 bg-error dark:bg-error-dark text-white dark:text-error-on-dark rounded-full text-sm font-semibold hover:bg-error/90 shadow-sm transition-colors">Delete</button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default RecordDetail;
