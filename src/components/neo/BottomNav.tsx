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
    <nav
      className="fixed bottom-0 left-0 w-full z-50 pb-safe"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(232,230,225,0.8)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center justify-center w-1/4 gap-0.5 active:scale-95 transition-transform duration-100"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10'
                    : 'bg-transparent'
                }`}
              >
                <span
                  className={`material-symbols-outlined transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-blink-muted'
                  }`}
                  style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-blink-muted'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
