import React from "react";
import { Business } from "../../types";
import { BusinessCard } from "../BusinessCard";
import { Grid } from "./Grid";
import { useResponsive } from "../../hooks/useResponsive";

interface ResponsiveBusinessGridProps {
  businesses: Business[];
  onBenefitClick?: (businessId: string, benefitIndex: number) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  variant?: "default" | "compact" | "featured";
  setLoadingRef?: (node: HTMLDivElement | null) => void;
}

export const ResponsiveBusinessGrid: React.FC<ResponsiveBusinessGridProps> = ({
  businesses,
  onBenefitClick,
  isLoading = false,
  isLoadingMore = false,
  hasMore = true,
  variant = "default",
  setLoadingRef,
}) => {
  const { isDesktop } = useResponsive();

  // Auto-select variant based on screen size if default is specified
  const effectiveVariant =
    variant === "default" && isDesktop ? "compact" : variant;

  // Define responsive grid configurations based on variant
  const gridConfigs = {
    default: {
      cols: { xs: 1, sm: 1, md: 2, lg: 2, xl: 3 },
      gap: "md" as const,
    },
    compact: {
      cols: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
      gap: "sm" as const,
    },
    featured: {
      cols: { xs: 1, sm: 1, md: 1, lg: 2, xl: 2 },
      gap: "lg" as const,
    },
  };

  const config = gridConfigs[effectiveVariant];

  if (isLoading) {
    // Show skeleton loading grid with responsive heights
    const skeletonHeight =
      effectiveVariant === "compact" ? "h-32 lg:h-48" : "h-48";
    const skeletonPadding =
      effectiveVariant === "compact" ? "p-4 lg:p-4" : "p-6";

    return (
      <Grid cols={config.cols} gap={config.gap}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse"
          >
            <div className={`w-full ${skeletonHeight} bg-gray-200`} />
            <div className={`${skeletonPadding} space-y-4`}>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </Grid>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏪</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No benefits found
        </h3>
        <p className="text-gray-500">
          No benefits available from your MongoDB API. Try adjusting your search
          or check if your API is running on port 3002.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Grid cols={config.cols} gap={config.gap}>
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            variant={effectiveVariant}
            onBenefitClick={(benefitIndex) =>
              onBenefitClick && onBenefitClick(business.id, benefitIndex)
            }
          />
        ))}
      </Grid>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading more benefits...</span>
          </div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !isLoading && setLoadingRef && (
        <div
          ref={setLoadingRef}
          className="h-10 flex justify-center items-center"
        >
          {!isLoadingMore && (
            <div className="text-gray-400 text-sm">
              Scroll for more benefits
            </div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && businesses.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🎉</div>
          <p className="text-gray-500">
            You've seen all {businesses.length} benefits!
          </p>
        </div>
      )}
    </div>
  );
};
