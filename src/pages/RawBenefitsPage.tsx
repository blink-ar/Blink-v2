/**
 * RawBenefitsPage
 *
 * Demonstrates using benefits data in the exact format as returned by the API
 * (data.benefits structure) without any transformation
 */

import React, { useState, useEffect, useCallback } from "react";
import { RawMongoBenefit } from "../types/mongodb";
import { getRawBenefitsWithLimit } from "../services/rawBenefitsApi";
import { RawBenefitCard } from "../components/RawBenefitCard";

export const RawBenefitsPage: React.FC = () => {
  const [benefits, setBenefits] = useState<RawMongoBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  const loadBenefits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading raw benefits with limit:", limit);

      // Get benefits in exact API format
      const rawBenefits = await getRawBenefitsWithLimit(limit);

      console.log("📊 Loaded raw benefits:", {
        count: rawBenefits.length,
        firstBenefit: rawBenefits[0] || null,
      });

      setBenefits(rawBenefits);
    } catch (err) {
      console.error("❌ Error loading raw benefits:", err);
      setError(err instanceof Error ? err.message : "Failed to load benefits");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  const handleReset = () => {
    setLimit(20);
  };

  if (loading && benefits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading raw benefits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadBenefits}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Raw Benefits (Exact API Format)
              </h1>
              <p className="text-gray-600 mt-1">
                Benefits displayed in the exact format as returned by
                data.benefits
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Showing {benefits.length} benefits
              </span>
              <button
                onClick={handleReset}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Raw Data Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Benefits:</span>{" "}
              {benefits.length}
            </div>
            <div>
              <span className="font-medium">Unique Banks:</span>{" "}
              {new Set(benefits.map((b) => b.bank)).size}
            </div>
            <div>
              <span className="font-medium">Unique Merchants:</span>{" "}
              {new Set(benefits.map((b) => b.merchant?.name)).size}
            </div>
          </div>

          {benefits.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium mb-2">
                Sample Raw Benefit Structure:
              </p>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(
                  {
                    _id: benefits[0]._id,
                    merchant: benefits[0].merchant,
                    bank: benefits[0].bank,
                    benefitTitle: benefits[0].benefitTitle,
                    discountPercentage: benefits[0].discountPercentage,
                    categories: benefits[0].categories,
                    location: benefits[0].location,
                    online: benefits[0].online,
                    availableDays: benefits[0].availableDays,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        {benefits.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <RawBenefitCard
                  key={benefit._id?.$oid || index}
                  benefit={benefit}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : `Load More (showing ${limit})`}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No benefits found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RawBenefitsPage;
