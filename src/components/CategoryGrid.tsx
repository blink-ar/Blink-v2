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
    "grid",
    4 // 4 columns in the grid
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
        className="category-grid__container grid grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        role="group"
        aria-label="Categorías de productos"
      >
        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(el) => {
              if (el) itemsRef.current[index] = el;
            }}
            className={`category-grid__item category-item touch-target touch-button touch-feedback flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all focus-visible:focus-visible micro-bounce ${
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
            }}
          >
            <div
              className="category-grid__icon w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
              style={{ backgroundColor: category.color }}
            >
              <span className="category-grid__icon-text text-lg sm:text-xl md:text-2xl">
                {category.icon}
              </span>
            </div>
            <span className="category-grid__label text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-1">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
