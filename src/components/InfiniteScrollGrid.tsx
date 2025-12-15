import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Business } from "../types";
import BusinessCard from "./BusinessCard";

interface InfiniteScrollGridProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  initialLoadCount?: number;
  loadMoreCount?: number;
  /** Initial display count to restore from (for scroll restoration) */
  restoredDisplayCount?: number;
  /** Callback when display count changes (for state saving) */
  onDisplayCountChange?: (count: number) => void;
}

/**
 * InfiniteScrollGrid - Renders a grid of businesses with infinite scroll
 * 
 * Uses Intersection Observer to detect when user scrolls near the bottom
 * and loads more items incrementally for better performance with 1000+ items.
 */
const InfiniteScrollGrid: React.FC<InfiniteScrollGridProps> = ({
  businesses,
  onBusinessClick,
  initialLoadCount = 20,
  loadMoreCount = 20,
  restoredDisplayCount,
  onDisplayCountChange,
}) => {
  // Track how many items to display - use restored count if available
  const [displayCount, setDisplayCount] = useState(
    restoredDisplayCount || initialLoadCount
  );
  
  // Ref for the sentinel element at the bottom
  const observerRef = useRef<HTMLDivElement>(null);
  
  // Reset display count when businesses array changes (e.g., filter applied)
  // But only if we don't have a restored count
  useEffect(() => {
    if (!restoredDisplayCount) {
      setDisplayCount(initialLoadCount);
    }
  }, [businesses.length, initialLoadCount, restoredDisplayCount]);
  
  // Notify parent of display count changes
  useEffect(() => {
    onDisplayCountChange?.(displayCount);
  }, [displayCount, onDisplayCountChange]);
  
  // Get the businesses to display (sliced to current display count)
  const displayedBusinesses = useMemo(
    () => businesses.slice(0, displayCount),
    [businesses, displayCount]
  );
  
  // Check if there are more items to load
  const hasMore = displayCount < businesses.length;
  
  // Load more items callback
  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount((prev) =>
        Math.min(prev + loadMoreCount, businesses.length)
      );
    }
  }, [hasMore, loadMoreCount, businesses.length]);
  
  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel becomes visible, load more
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        // Trigger when sentinel is 200px from viewport
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
  }, [hasMore, loadMore]);

  if (businesses.length === 0) {
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
        {displayedBusinesses.map((business, index) => (
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
      {!hasMore && businesses.length > initialLoadCount && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Mostrando todos los {businesses.length} resultados
        </div>
      )}
    </>
  );
};

export default InfiniteScrollGrid;
