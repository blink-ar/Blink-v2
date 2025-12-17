import React from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { queryKeys } from "../hooks/useBenefitsData";

interface CacheStatusProps {
  className?: string;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ className = "" }) => {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Update stats periodically
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 5000);
    return () => clearInterval(interval);
  }, []);

  const businessesQuery = queryClient.getQueryState(queryKeys.businesses);
  const featuredQuery = queryClient.getQueryState(queryKeys.featuredBenefits);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const handleClearCache = () => {
    queryClient.clear();
    forceUpdate();
  };

  const getCacheEntryCount = () => {
    return queryClient.getQueryCache().getAll().length;
  };

  const getLastUpdated = () => {
    const timestamps = [
      businessesQuery?.dataUpdatedAt,
      featuredQuery?.dataUpdatedAt,
    ].filter(Boolean) as number[];

    if (timestamps.length === 0) return null;
    return Math.max(...timestamps);
  };

  const lastUpdated = getLastUpdated();

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Cache Status</h4>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching > 0}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isFetching > 0 ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={handleClearCache}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="font-medium">Cached Queries:</span> {getCacheEntryCount()}
        </div>
        <div>
          <span className="font-medium">Fetching:</span> {isFetching}
        </div>
        <div>
          <span className="font-medium">Businesses:</span>{" "}
          {businessesQuery?.status || "none"}
        </div>
        <div>
          <span className="font-medium">Featured:</span>{" "}
          {featuredQuery?.status || "none"}
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
