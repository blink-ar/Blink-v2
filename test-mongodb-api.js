/**
 * Simple test script for MongoDB API
 * 
 * You can run this in several ways:
 * 1. Browser console (copy and paste)
 * 2. Node.js script
 * 3. Add to your React app temporarily
 */

// Test function that works in browser or Node.js
async function testMongoDBAPI() {
    const BASE_URL = 'http://localhost:3002';

    console.log('🚀 Testing MongoDB Benefits API...\n');

    // Test 1: Get all benefits
    try {
        console.log('1️⃣ Testing GET /api/benefits');
        const response = await fetch(`${BASE_URL}/api/benefits`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const benefits = await response.json();
        console.log('✅ Success! Got', Array.isArray(benefits) ? benefits.length : 'non-array', 'benefits');
        console.log('📊 Sample benefit:', benefits[0]);
        console.log('');
    } catch (error) {
        console.error('❌ Error testing /api/benefits:', error.message);
        console.log('');
    }

    // Test 2: Get categories
    try {
        console.log('2️⃣ Testing GET /api/categories');
        const response = await fetch(`${BASE_URL}/api/categories`);
        const categories = await response.json();
        console.log('✅ Success! Categories:', categories);
        console.log('');
    } catch (error) {
        console.error('❌ Error testing /api/categories:', error.message);
        console.log('');
    }

    // Test 3: Get banks
    try {
        console.log('3️⃣ Testing GET /api/banks');
        const response = await fetch(`${BASE_URL}/api/banks`);
        const banks = await response.json();
        console.log('✅ Success! Banks:', banks);
        console.log('');
    } catch (error) {
        console.error('❌ Error testing /api/banks:', error.message);
        console.log('');
    }

    // Test 4: Get stats
    try {
        console.log('4️⃣ Testing GET /api/stats');
        const response = await fetch(`${BASE_URL}/api/stats`);
        const stats = await response.json();
        console.log('✅ Success! Stats:', stats);
        console.log('');
    } catch (error) {
        console.error('❌ Error testing /api/stats:', error.message);
        console.log('');
    }

    // Test 5: Get nearby benefits (example coordinates for Buenos Aires)
    try {
        console.log('5️⃣ Testing GET /api/benefits/nearby');
        const lat = -34.6037;
        const lng = -58.3816;
        const response = await fetch(`${BASE_URL}/api/benefits/nearby?lat=${lat}&lng=${lng}&radius=5000`);
        const nearbyBenefits = await response.json();
        console.log('✅ Success! Nearby benefits:', Array.isArray(nearbyBenefits) ? nearbyBenefits.length : 'non-array', 'items');
        console.log('');
    } catch (error) {
        console.error('❌ Error testing /api/benefits/nearby:', error.message);
        console.log('');
    }

    console.log('🏁 API testing complete!');
}

// Run the test
testMongoDBAPI();