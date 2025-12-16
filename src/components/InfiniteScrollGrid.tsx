import React, { useEffect, useRef, useCallback } from "react";
import { Business } from "../types";
import BusinessCard from "./BusinessCard";

interface InfiniteScrollGridProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalCount?: number;
}

/**
 * InfiniteScrollGrid - Renders a grid of businesses with infinite scroll
 *
 * Uses Intersection Observer to detect when user scrolls near the bottom
 * and triggers server-side pagination via onLoadMore callback.
 */
const InfiniteScrollGrid: React.FC<InfiniteScrollGridProps> = ({
  businesses,
  onBusinessClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
  totalCount,
}) => {
  // Ref for the sentinel element at the bottom
  const observerRef = useRef<HTMLDivElement>(null);

  // Load more callback with debounce protection
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  if (businesses.length === 0 && !isLoadingMore) {
    return (
      <div className="text-center py-12 md:py-16">
        <div className="text-gray-400 text-5xl md:text-6xl mb-4">🔍</div>
        <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
          No se encontraron resultados
        </h3>
        <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
          Intenta con otros términos de búsqueda o selecciona una categoría
          diferente
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Business Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {businesses.map((business, index) => (
          <BusinessCard
            key={business.id}
            business={business}
            onClick={onBusinessClick}
            className="card-hover business-card micro-lift"
            style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
          />
        ))}
      </div>

      {/* Loading indicator / Sentinel */}
      {hasMore && (
        <div
          ref={observerRef}
          className="flex justify-center items-center py-8"
          aria-label="Cargando más resultados"
        >
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full" />
            <span className="text-sm">Cargando más...</span>
          </div>
        </div>
      )}

      {/* End message */}
      {!hasMore && businesses.length > 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          {totalCount
            ? `Mostrando todos los ${totalCount} resultados`
            : `Mostrando ${businesses.length} resultados`}
        </div>
      )}
    </>
  );
};

export default InfiniteScrollGrid;
