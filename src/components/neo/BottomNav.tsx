import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export type NavTab = 'home' | 'search' | 'saved' | 'profile';

const tabs = [
  { id: 'home' as NavTab, label: 'Inicio', icon: 'home', path: '/home' },
  { id: 'search' as NavTab, label: 'Buscar', icon: 'search', path: '/search' },
  { id: 'saved' as NavTab, label: 'Guardados', icon: 'favorite', path: '/saved' },
  { id: 'profile' as NavTab, label: 'Perfil', icon: 'person', path: '/profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  const getActiveTab = (): NavTab => {
    const path = location.pathname;
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/saved')) return 'saved';
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-blink-surface border-t-2 border-blink-ink z-50 pb-safe">
      <div className="flex justify-around items-end h-16 pb-2 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-1 w-1/4 group active:scale-95 transition-transform ${
                isActive ? '' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div
                className={`border-2 border-blink-ink p-1 shadow-hard-sm group-hover:-translate-y-1 transition-transform ${
                  isActive ? 'bg-blink-warning' : 'bg-white'
                }`}
              >
                <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>
                  {tab.icon}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
