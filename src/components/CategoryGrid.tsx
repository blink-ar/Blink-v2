import React, { useRef, useEffect } from "react";
import { useKeyboardNavigation } from "../hooks/useFocusManagement";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
  selectedCategory?: string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onCategorySelect,
  selectedCategory,
}) => {
  const itemsRef = useRef<HTMLElement[]>([]);
  const { handleKeyDown, setCurrentIndex } = useKeyboardNavigation(
    { current: itemsRef.current },
    "horizontal",
    1 // Single row horizontal navigation
  );

  useEffect(() => {
    // Set up keyboard navigation
    const container = itemsRef.current[0]?.parentElement;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown]);

  return (
    <div className="category-grid px-4 sm:px-6 md:px-8 py-6">
      <h2 className="category-grid__title text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Categorías
      </h2>
      <div
        className="category-grid__container overflow-x-auto [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Categorías de productos"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* Internet Explorer 10+ */,
        }}
      >
        <div className="flex gap-3 sm:gap-4 pb-2">
          {categories.map((category, index) => (
            <button
              key={category.id}
              ref={(el) => {
                if (el) itemsRef.current[index] = el;
              }}
              className={`category-grid__item category-item touch-target touch-button touch-feedback flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all focus-visible:focus-visible micro-bounce flex-shrink-0 ${
                selectedCategory === category.id
                  ? "category-grid__item--active bg-primary-50 border-2 border-primary-500"
                  : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() => {
                onCategorySelect(category);
                setCurrentIndex(index);
              }}
              onFocus={() => setCurrentIndex(index)}
              aria-label={`Seleccionar categoría ${category.name}`}
              aria-pressed={selectedCategory === category.id}
              tabIndex={index === 0 ? 0 : -1} // Roving tabindex
              style={{
                minHeight: "var(--touch-target-comfortable)",
                minWidth: "var(--touch-target-comfortable)",
                width: "90px", // Increased width for longer category names
              }}
            >
              <div
                className="category-grid__icon w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: category.color }}
              >
                <span className="category-grid__icon-text text-lg sm:text-xl">
                  {category.icon}
                </span>
              </div>
              <span className="category-grid__label text-[10px] font-medium text-gray-700 text-center line-clamp-2 leading-[1.1] break-words hyphens-auto">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
