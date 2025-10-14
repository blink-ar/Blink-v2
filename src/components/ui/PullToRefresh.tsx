import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className = "",
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Only start pull-to-refresh if we're at the top of the scroll container
      const container = containerRef.current;
      if (container && container.scrollTop === 0) {
        startY.current = event.touches[0].clientY;
        setIsPulling(true);
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isPulling || disabled || isRefreshing) return;

      currentY.current = event.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      // Apply resistance to the pull distance
      const resistance = 0.5;
      const adjustedDistance = distance * resistance;

      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));

      // Prevent default scrolling when pulling down
      if (distance > 0) {
        event.preventDefault();
      }
    },
    [isPulling, disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const refreshIndicatorHeight = Math.min(pullDistance, threshold);
  const isTriggered = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${
          isPulling || isRefreshing ? refreshIndicatorHeight : 0
        }px)`,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-50 border-b border-gray-200"
        style={{
          height: `${refreshIndicatorHeight}px`,
          transform: `translateY(-${refreshIndicatorHeight}px)`,
          opacity: refreshIndicatorHeight > 0 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw
            className={`h-5 w-5 ${
              isRefreshing ? "animate-spin" : isTriggered ? "rotate-180" : ""
            } transition-transform duration-200`}
          />
          <span className="text-sm font-medium">
            {isRefreshing
              ? "Refreshing..."
              : isTriggered
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};
