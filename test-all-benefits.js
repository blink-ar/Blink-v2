// Test script to demonstrate different ways to fetch all benefits
const BASE_URL = 'http://localhost:3002';

async function testAllBenefitsMethods() {
    console.log('🧪 Testing different methods to fetch ALL benefits...\n');

    try {
        // Method 1: Request without limit (what your API actually returns)
        console.log('📄 Method 1: Request without limit parameter...');
        const noLimitResponse = await fetch(`${BASE_URL}/api/benefits`);
        const noLimitData = await noLimitResponse.json();
        console.log(`Result: ${noLimitData.benefits?.length || 0} benefits (likely has default limit)\n`);

        // Method 2: Request with very high limit
        console.log('📄 Method 2: Request with very high limit (limit=10000)...');
        const highLimitResponse = await fetch(`${BASE_URL}/api/benefits?limit=10000`);
        const highLimitData = await highLimitResponse.json();
        console.log(`Result: ${highLimitData.benefits?.length || 0} benefits\n`);

        // Method 3: Pagination approach (recommended)
        console.log('📄 Method 3: Pagination approach (fetch in chunks)...');
        const allBenefits = [];
        let offset = 0;
        const limit = 200;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < 20) { // Safety limit
            pageCount++;
            console.log(`  📄 Fetching page ${pageCount} (offset: ${offset}, limit: ${limit})...`);

            const pageResponse = await fetch(`${BASE_URL}/api/benefits?limit=${limit}&offset=${offset}`);
            const pageData = await pageResponse.json();

            if (!pageData.benefits || pageData.benefits.length === 0) {
                hasMore = false;
                console.log('  🏁 No more benefits found');
                break;
            }

            allBenefits.push(...pageData.benefits);
            console.log(`  ✅ Page ${pageCount}: ${pageData.benefits.length} benefits (Total: ${allBenefits.length})`);

            if (pageData.benefits.length < limit) {
                hasMore = false;
                console.log('  🏁 Reached end of data');
                break;
            }

            offset += pageData.benefits.length;
        }

        console.log(`📊 Pagination method result: ${allBenefits.length} total benefits\n`);

        // Get stats for comparison
        console.log('📊 Getting stats for comparison...');
        const statsResponse = await fetch(`${BASE_URL}/api/stats`);
        const statsData = await statsResponse.json();
        console.log(`Stats show: ${statsData.stats?.totalBenefits || 0} total benefits in database\n`);

        // Summary
        console.log('📋 SUMMARY:');
        console.log(`- Method 1 (no limit): ${noLimitData.benefits?.length || 0} benefits`);
        console.log(`- Method 2 (high limit): ${highLimitData.benefits?.length || 0} benefits`);
        console.log(`- Method 3 (pagination): ${allBenefits.length} benefits`);
        console.log(`- Database total: ${statsData.stats?.totalBenefits || 0} benefits`);

        // Recommendation
        if (highLimitData.benefits?.length === statsData.stats?.totalBenefits) {
            console.log('\n✅ RECOMMENDATION: Use Method 2 (high limit) - it gets all benefits in one request');
            console.log('   Example: fetchBenefits({ limit: "10000" })');
        } else {
            console.log('\n✅ RECOMMENDATION: Use Method 3 (pagination) - it\'s more reliable and efficient');
            console.log('   Example: fetchAllBenefitsEfficient()');
        }

    } catch (error) {
        console.error('❌ Error testing methods:', error);
    }
}

testAllBenefitsMethods();