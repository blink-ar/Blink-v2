import React from "react";
import { getBenefitsDataService } from "../services/BenefitsDataService";

interface CacheStatusProps {
  className?: string;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ className = "" }) => {
  const [stats, setStats] = React.useState<{
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    oldestEntry: number;
    newestEntry: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    const updateStats = () => {
      const cacheStats = getBenefitsDataService().getCacheStats();
      setStats(cacheStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await getBenefitsDataService().refreshAllData();
    } catch (error) {
      // Silent fail
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = () => {
    getBenefitsDataService().clearCache();
    setStats(null);
  };

  if (!stats) {
    return null;
  }

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Cache Status</h4>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
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
          <span className="font-medium">Entries:</span> {stats.totalEntries}
        </div>
        <div>
          <span className="font-medium">Size:</span>{" "}
          {Math.round(stats.totalSize / 1024)}KB
        </div>
        <div>
          <span className="font-medium">Hit Rate:</span>{" "}
          {Math.round(stats.hitRate * 100)}%
        </div>
        <div>
          <span className="font-medium">Miss Rate:</span>{" "}
          {Math.round(stats.missRate * 100)}%
        </div>
      </div>

      {stats.newestEntry > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(stats.newestEntry).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
