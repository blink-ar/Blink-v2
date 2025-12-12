import React from 'react';

export type TabType = 'benefits' | 'info';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  benefitsCount?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  benefitsCount,
}) => {
  const tabs = [
    { id: 'benefits' as TabType, label: 'Beneficios', count: benefitsCount },
    { id: 'info' as TabType, label: 'Información' },
  ];

  return (
    <div
      className="sticky top-0 z-10 bg-white border-b border-gray-200"
      role="tablist"
      aria-label="Navegación de detalles del negocio"
    >
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                ${
                  isActive
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
              style={{ minHeight: '48px' }}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`
                      inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
                      ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
