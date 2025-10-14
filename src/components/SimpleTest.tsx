import React, { useState, useEffect } from "react";
import { getBenefits } from "../services/api";
import { Benefit } from "../types/mongodb";

/**
 * Simple test component to see if benefits are being fetched
 */
export const SimpleTest: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBenefits = async () => {
      try {
        console.log("🧪 SimpleTest: Loading benefits...");
        const data = await getBenefits();
        console.log("🧪 SimpleTest: Got benefits:", data);
        setBenefits(data);
      } catch (err) {
        console.error("🧪 SimpleTest: Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadBenefits();
  }, []);

  if (loading) {
    return <div className="p-4">Loading benefits...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Benefits Test</h2>
      <p className="mb-4">Found {benefits.length} benefits</p>

      {benefits.length === 0 ? (
        <div className="text-gray-500">No benefits found</div>
      ) : (
        <div className="space-y-4">
          {benefits.slice(0, 3).map((benefit) => (
            <div key={benefit.id} className="border p-4 rounded">
              <h3 className="font-bold">🏪 {benefit.merchant.name}</h3>
              <p className="text-sm text-gray-600">🏦 {benefit.bank}</p>
              <p className="text-sm">{benefit.benefitTitle}</p>
              <p className="text-xs text-gray-500">
                {benefit.discountPercentage}% discount
              </p>
            </div>
          ))}
          {benefits.length > 3 && (
            <p className="text-gray-500">... and {benefits.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
};
