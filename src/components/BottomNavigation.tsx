import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type NavigationTab = "inicio" | "beneficios";

interface NavigationItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavigationProps {
  activeTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use the provided activeTab or default to "inicio"
  const currentTab: NavigationTab = activeTab || "inicio";

  const navigationItems: NavigationItem[] = [
    {
      id: "inicio",
      label: "Inicio",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 22V12H15V22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "beneficios",
      label: "Beneficios",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    // Call the provided onTabChange if available
    if (onTabChange) {
      onTabChange(tab);
    }

    // Only navigate to home if we're not already there and switching to "inicio"
    if (tab === "inicio" && location.pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden"
      role="navigation"
      aria-label="Navegación principal"
      style={{
        height: "var(--nav-height, 80px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex justify-around items-center h-full px-2 sm:px-4">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center justify-center py-2 px-1 sm:px-2 rounded-lg transition-all duration-200 ${
              currentTab === item.id
                ? "text-primary-600 bg-primary-50"
                : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
            }`}
            onClick={() => handleTabClick(item.id)}
            aria-label={`Ir a ${item.label}`}
            aria-current={currentTab === item.id ? "page" : undefined}
            style={{
              minWidth: "var(--touch-target-min)",
              minHeight: "var(--touch-target-min)",
            }}
          >
            <div className="mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {React.cloneElement(item.icon as React.ReactElement, {
                className: "w-full h-full",
              })}
            </div>
            <span className="text-xs font-medium line-clamp-1">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
