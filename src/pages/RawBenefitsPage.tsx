import React, { useState, useEffect } from "react";
import { RawBenefit } from "../types/benefit";
import { RawBenefitCard } from "../components/RawBenefitCard";
import {
  getRawBenefits,
  getRawCategories,
  getRawBanks,
} from "../services/rawBenefitsApi";

/**
 * Simple page that displays your raw MongoDB benefits
 * No transformation, no changes, just your data as-is
 */
export const RawBenefitsPage: React.FC = () => {
  const [benefits, setBenefits] = useState<RawBenefit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 Loading raw benefits data...");

      // Load benefits, categories, and banks
      const [benefitsData, categoriesData, banksData] = await Promise.all([
        getRawBenefits({ limit: "1000", offset: "1000" }), // Your preferred settings
        getRawCategories(),
        getRawBanks(),
      ]);

      setBenefits(benefitsData);
      setCategories(categoriesData);
      setBanks(banksData);

      console.log("✅ Raw data loaded:", {
        benefits: benefitsData.length,
        categories: categoriesData.length,
        banks: banksData.length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load benefits";
      setError(errorMessage);
      console.error("❌ Error loading raw data:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        limit: "1000",
        offset: "1000",
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedBank) params.bank = selectedBank;

      const filteredBenefits = await getRawBenefits(params);
      setBenefits(filteredBenefits);

      console.log("🔍 Applied filters:", {
        selectedCategory,
        selectedBank,
        results: filteredBenefits.length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to filter benefits";
      setError(errorMessage);
      console.error("❌ Error applying filters:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setSelectedCategory("");
    setSelectedBank("");
    await loadData();
  };

  if (loading && benefits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading raw benefits from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Benefits
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Retry
            </button>
            <p className="text-sm text-gray-500">
              Using MongoDB API from{" "}
              <code>https://benefits-backend-v2-public.onrender.com</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Raw MongoDB Benefits
          </h1>
          <p className="text-gray-600">
            Your benefits exactly as they are in your database - no
            transformation
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🔍 Filter Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="capitalize"
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All banks</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Filtering..." : "Apply Filters"}
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={loading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{benefits.length}</span> raw
            benefits
            {selectedCategory && (
              <span>
                {" "}
                in{" "}
                <span className="font-semibold capitalize">
                  {selectedCategory}
                </span>
              </span>
            )}
            {selectedBank && (
              <span>
                {" "}
                from <span className="font-semibold">{selectedBank}</span>
              </span>
            )}
          </p>
        </div>

        {/* Benefits List */}
        {benefits.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Benefits Found
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory || selectedBank
                ? "No benefits match your current filters."
                : "No benefits available from your MongoDB API."}
            </p>
            {(selectedCategory || selectedBank) && (
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {benefits.map((benefit) => (
              <RawBenefitCard key={benefit._id.$oid} benefit={benefit} />
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "🔄 Loading..." : "🔄 Refresh Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
