import React from 'react';
import { ChartBarIcon, DatabaseIcon, PaintBrushIcon } from './Icons';

interface OnboardingProps {
    onFinish: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, delay: string }> = ({ icon, title, description, delay }) => (
    <div className={`bg-white/5 dark:bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl flex flex-col items-center text-center animate-fadeInUp`} style={{ animationDelay: delay }}>
        <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-full text-primary mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300">{description}</p>
    </div>
);


const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white font-sans flex flex-col justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="text-center animate-fadeInUp">
                <h1 className="text-4xl font-bold mb-2">Welcome to Ayshas Finance Tracker</h1>
                <p className="text-lg text-slate-400">Your simple daily profit & loss tracker.</p>
            </div>
            
            <div className="space-y-6">
                <FeatureCard 
                    icon={<ChartBarIcon className="w-8 h-8"/>}
                    title="Track Daily Finances"
                    description="Easily log your morning & night sales and all your expenses."
                    delay="100ms"
                />
                 <FeatureCard 
                    icon={<PaintBrushIcon className="w-8 h-8"/>}
                    title="Customize Your Expenses"
                    description="Tailor the app to your business by managing your own expense items in Settings."
                    delay="250ms"
                />
                 <FeatureCard 
                    icon={<DatabaseIcon className="w-8 h-8"/>}
                    title="Backup & Secure Data"
                    description="Never lose your data. Export your records for safekeeping or use in other apps."
                    delay="400ms"
                />
            </div>
            
            <button
                onClick={onFinish}
                className="w-full bg-secondary hover:bg-primary text-white font-bold py-4 px-4 rounded-xl text-lg shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-secondary/30 animate-fadeInUp"
                style={{ animationDelay: '600ms' }}
            >
                Get Started
            </button>
        </div>
    );
};

export default Onboarding;