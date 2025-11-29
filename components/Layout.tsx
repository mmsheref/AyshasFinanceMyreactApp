
import React from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { PlusIcon, HomeIcon, ListIcon, BackIcon, SettingsIcon, ChartBarIcon } from './Icons';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getHeaderText = () => {
        const path = location.pathname;
        if (path === '/') return ''; // Dashboard has its own large header
        if (path.startsWith('/records/new')) return 'New Record';
        if (path.startsWith('/records/') && path.endsWith('/edit')) return 'Edit Record';
        if (path.startsWith('/records/')) return 'Details';
        if (path === '/records') return 'History';
        if (path === '/settings') return 'Settings';
        if (path === '/reports') return 'Analytics';
        return "Ayshas Finance Tracker";
    };

    const isFormPage = location.pathname.includes('/new') || location.pathname.includes('/edit');
    const isRootPage = ['/', '/records', '/reports', '/settings'].includes(location.pathname);
    const isDashboard = location.pathname === '/';
    const showBottomNav = !isFormPage;

    const handleBack = () => navigate(-1);

    // MD3 Navigation Bar Item
    // Active: Icon in Pill (Primary Container), Text Bold & High Emphasis
    // Inactive: Icon transparent, Text Normal & Medium Emphasis
    const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
        <NavLink to={to} className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full gap-1 group`}>
            {({ isActive }) => (
                <>
                    <div className={`w-16 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-primary-container dark:bg-primary-container-dark text-primary-on-container dark:text-primary-on-container-dark' : 'bg-transparent text-surface-on-variant dark:text-surface-on-variant-dark'}`}>
                        {icon}
                    </div>
                    <span className={`text-[12px] transition-colors ${isActive ? 'font-bold text-surface-on dark:text-surface-on-dark' : 'font-medium text-surface-on-variant dark:text-surface-on-variant-dark'}`}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );

    return (
        <div className="min-h-screen font-sans flex flex-col bg-surface dark:bg-surface-dark text-surface-on dark:text-white">
            {/* Top App Bar (Only for non-dashboard pages) */}
            {!isDashboard && (
                <header className="sticky top-0 z-20 bg-surface dark:bg-surface-dark pt-[env(safe-area-inset-top)] px-4 h-[64px] flex items-center justify-between transition-colors duration-200">
                    <div className="flex items-center">
                        {!isRootPage && (
                            <button onClick={handleBack} className="p-3 mr-1 -ml-3 rounded-full hover:bg-surface-variant/30 active:bg-surface-variant/50 transition-colors" aria-label="Go back">
                                <BackIcon className="w-6 h-6 text-surface-on dark:text-white" />
                            </button>
                        )}
                        <h1 className="text-xl font-medium tracking-normal text-surface-on dark:text-white pl-2">
                            {getHeaderText()}
                        </h1>
                    </div>
                </header>
            )}
            
            {/* Main Content */}
            <main 
                className={`flex-grow px-4 pb-24 animate-fadeScale ${isDashboard ? 'pt-[calc(env(safe-area-inset-top)+1rem)]' : ''}`}
            >
                <Outlet />
            </main>

            {/* MD3 Bottom Navigation Bar */}
            {showBottomNav && (
                <nav className="fixed bottom-0 left-0 right-0 bg-surface-container/90 dark:bg-surface-dark-container/90 backdrop-blur-xl z-30 border-t border-surface-outline/10 dark:border-surface-outline-dark/10 pb-[env(safe-area-inset-bottom)] h-[80px] flex items-center justify-between px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" />
                    <NavItem to="/records" icon={<ListIcon className="w-6 h-6" />} label="Records" />
                    <NavItem to="/reports" icon={<ChartBarIcon className="w-6 h-6" />} label="Reports" />
                    <NavItem to="/settings" icon={<SettingsIcon className="w-6 h-6" />} label="Settings" />
                </nav>
            )}

            {/* MD3 Floating Action Button (FAB) */}
            {['/', '/records'].includes(location.pathname) && (
                <div className="fixed bottom-[100px] right-4 z-40">
                    <button
                        onClick={() => navigate('/records/new')}
                        className="w-14 h-14 bg-primary-container dark:bg-primary-container-dark hover:bg-primary-container/90 dark:hover:bg-primary-container-dark/90 active:scale-95 text-primary-on-container dark:text-primary-on-container-dark rounded-[16px] shadow-md3-1 flex items-center justify-center transition-all duration-200"
                        aria-label="Add New Record"
                    >
                        <PlusIcon className="h-7 w-7" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Layout;