/**
 * Test the integration with your actual API structure
 * Run this in browser console or Node.js
 */

async function testIntegration() {
  const BASE_URL = 'http://localhost:3002';
  
  console.log('🧪 Testing API Integration with your structured response...\n');

  // Test the raw API response
  try {
    console.log('1️⃣ Testing raw API response structure');
    const response = await fetch(`${BASE_URL}/api/benefits`);
    const rawData = await response.json();
    
    console.log('✅ Raw API Response:', rawData);
    console.log('📊 Structure:', {
      hasSuccess: 'success' in rawData,
      hasBenefits: 'benefits' in rawData,
      benefitsIsArray: Array.isArray(rawData.benefits),
      benefitsCount: rawData.benefits?.length || 0,
      hasPagination: 'pagination' in rawData
    });
    console.log('');
    
    // Test if our integration handles it correctly
    console.log('2️⃣ Testing integration handling');
    
    // Simulate what our BenefitsAPI.getBenefits() does
    const processedData = rawData && typeof rawData === 'object' && Array.isArray(rawData.benefits) 
      ? rawData.benefits 
      : Array.isArray(rawData) ? rawData : [];
    
    console.log('✅ Processed data:', processedData);
    console.log('📊 Processed structure:', {
      isArray: Array.isArray(processedData),
      length: processedData.length,
      firstItem: processedData[0] || 'No items'
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🏁 Integration test complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Add some benefits data to your MongoDB');
  console.log('2. Test again to see the data transformation');
  console.log('3. Your React app should now work with the API!');
}

// Run the test
testIntegration();