import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type NavigationTab = "inicio" | "beneficios";

interface BottomNavigationProps {
  activeTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = "inicio",
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "inicio", label: "Inicio", icon: "🏠" },
    { id: "beneficios", label: "Beneficios", icon: "⭐" },
  ] as const;

  const handleClick = (tab: NavigationTab) => {
    onTabChange?.(tab);
    if (tab === "inicio" && location.pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden h-16">
      <div className="flex justify-around items-center h-full">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`flex flex-col items-center py-1 px-3 rounded transition-colors ${
              activeTab === id
                ? "text-primary-600 bg-primary-50"
                : "text-gray-600 hover:text-primary-600"
            }`}
            onClick={() => handleClick(id)}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
