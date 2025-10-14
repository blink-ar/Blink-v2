// Test script to verify pagination is working
const BASE_URL = 'http://localhost:3002';

async function testPagination() {
    console.log('🧪 Testing pagination...');

    try {
        // Test first page
        console.log('\n📄 Testing first page (limit=10, offset=0)...');
        const firstPageResponse = await fetch(`${BASE_URL}/api/benefits?limit=10&offset=0`);
        const firstPageData = await firstPageResponse.json();

        console.log('First page results:', {
            success: firstPageData.success,
            benefitsCount: firstPageData.benefits?.length || 0,
            pagination: firstPageData.pagination,
            sampleBenefit: firstPageData.benefits?.[0]?.merchant?.name
        });

        // Test second page
        console.log('\n📄 Testing second page (limit=10, offset=10)...');
        const secondPageResponse = await fetch(`${BASE_URL}/api/benefits?limit=10&offset=10`);
        const secondPageData = await secondPageResponse.json();

        console.log('Second page results:', {
            success: secondPageData.success,
            benefitsCount: secondPageData.benefits?.length || 0,
            pagination: secondPageData.pagination,
            sampleBenefit: secondPageData.benefits?.[0]?.merchant?.name
        });

        // Test larger page
        console.log('\n📄 Testing larger page (limit=50, offset=0)...');
        const largePageResponse = await fetch(`${BASE_URL}/api/benefits?limit=50&offset=0`);
        const largePageData = await largePageResponse.json();

        console.log('Large page results:', {
            success: largePageData.success,
            benefitsCount: largePageData.benefits?.length || 0,
            pagination: largePageData.pagination,
            firstBenefit: largePageData.benefits?.[0]?.merchant?.name,
            lastBenefit: largePageData.benefits?.[largePageData.benefits?.length - 1]?.merchant?.name
        });

        // Test stats to see total available
        console.log('\n📊 Testing stats...');
        const statsResponse = await fetch(`${BASE_URL}/api/stats`);
        const statsData = await statsResponse.json();

        console.log('Stats:', statsData.stats);

    } catch (error) {
        console.error('❌ Error testing pagination:', error);
    }
}

testPagination();