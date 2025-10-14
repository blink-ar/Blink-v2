import React, { useState } from "react";
import {
  fetchBusinesses,
  fetchCategories,
  fetchBanks,
  fetchStats,
  fetchNearbyBenefits,
  benefitsAPI,
} from "../services/api";

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface TestResults {
  [testName: string]: TestResult;
}

/**
 * Temporary test component for MongoDB API
 * Add this to your app temporarily to test the API integration
 */
export const TestMongoAPI: React.FC = () => {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<unknown>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setResults((prev) => ({
        ...prev,
        [testName]: { success: true, data: result },
      }));
      console.log(`✅ ${testName} success:`, result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setResults((prev) => ({
        ...prev,
        [testName]: { success: false, error: errorMessage },
      }));
      console.error(`❌ ${testName} error:`, error);
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      name: "Raw Benefits",
      fn: () => benefitsAPI.getBenefits(),
    },
    {
      name: "Transformed Businesses",
      fn: () => fetchBusinesses(),
    },
    {
      name: "Categories",
      fn: () => fetchCategories(),
    },
    {
      name: "Banks",
      fn: () => fetchBanks(),
    },
    {
      name: "Stats",
      fn: () => fetchStats(),
    },
    {
      name: "Nearby Benefits",
      fn: () => fetchNearbyBenefits(-34.6037, -58.3816, { radius: "5000" }),
    },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>🧪 MongoDB API Test Panel</h2>
      <p>
        Make sure your MongoDB API is running on{" "}
        <code>http://localhost:3002</code>
      </p>

      <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
        {tests.map((test) => (
          <button
            key={test.name}
            onClick={() => runTest(test.name, test.fn)}
            disabled={loading === test.name}
            style={{
              padding: "10px",
              backgroundColor: results[test.name]?.success
                ? "#4ade80"
                : results[test.name]?.success === false
                ? "#f87171"
                : "#e5e7eb",
              border: "none",
              borderRadius: "4px",
              cursor: loading === test.name ? "not-allowed" : "pointer",
            }}
          >
            {loading === test.name ? "⏳ Testing..." : `🧪 Test ${test.name}`}
          </button>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "#f3f4f6",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h3>📊 Results:</h3>
        <pre style={{ fontSize: "12px", overflow: "auto", maxHeight: "400px" }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#6b7280" }}>
        <p>
          💡 <strong>Tips:</strong>
        </p>
        <ul>
          <li>Check the browser console for detailed logs</li>
          <li>Green buttons = API working ✅</li>
          <li>Red buttons = API error ❌</li>
          <li>Gray buttons = Not tested yet</li>
        </ul>
      </div>
    </div>
  );
};
