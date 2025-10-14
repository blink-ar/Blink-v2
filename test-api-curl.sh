#!/bin/bash

# Simple curl tests for MongoDB API
# Make sure your API is running on http://localhost:3002

BASE_URL="http://localhost:3002"

echo "🚀 Testing MongoDB Benefits API with curl..."
echo ""

echo "1️⃣ Testing GET /api/benefits"
curl -s -w "\nStatus: %{http_code}\n" "$BASE_URL/api/benefits" | head -20
echo ""
echo "---"

echo "2️⃣ Testing GET /api/categories"
curl -s -w "\nStatus: %{http_code}\n" "$BASE_URL/api/categories"
echo ""
echo "---"

echo "3️⃣ Testing GET /api/banks"
curl -s -w "\nStatus: %{http_code}\n" "$BASE_URL/api/banks"
echo ""
echo "---"

echo "4️⃣ Testing GET /api/stats"
curl -s -w "\nStatus: %{http_code}\n" "$BASE_URL/api/stats"
echo ""
echo "---"

echo "5️⃣ Testing GET /api/benefits/nearby"
curl -s -w "\nStatus: %{http_code}\n" "$BASE_URL/api/benefits/nearby?lat=-34.6037&lng=-58.3816&radius=5000" | head -10
echo ""

echo "🏁 API testing complete!"