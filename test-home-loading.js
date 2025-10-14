// Test to simulate what your Home component will do
const BASE_URL = 'http://localhost:3002';

async function simulateHomeComponentLoading() {
    console.log('🏠 Simulating Home component loading...\n');

    try {
        // This simulates what fetchAllBusinessesComplete() does
        console.log('🚀 Step 1: Loading ALL benefits using pagination...');
        console.time('⏱️ Total loading time');

        const allBenefits = [];
        let offset = 0;
        const limit = 200;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore) {
            pageCount++;
            console.log(`📄 Loading page ${pageCount} (offset: ${offset})...`);

            const response = await fetch(`${BASE_URL}/api/benefits?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            if (!data.benefits || data.benefits.length === 0) {
                console.log('🏁 No more benefits found');
                break;
            }

            allBenefits.push(...data.benefits);
            console.log(`✅ Page ${pageCount}: +${data.benefits.length} benefits (Total: ${allBenefits.length})`);

            if (data.benefits.length < limit) {
                console.log('🏁 Reached end of data');
                break;
            }

            offset += data.benefits.length;
        }

        console.timeEnd('⏱️ Total loading time');

        // Step 2: Transform benefits to businesses (simulate the grouping)
        console.log('\n🔄 Step 2: Transforming benefits to businesses...');
        const businessMap = new Map();

        allBenefits.forEach(benefit => {
            const businessName = benefit.merchant?.name || 'Unknown';
            if (!businessMap.has(businessName)) {
                businessMap.set(businessName, {
                    id: businessName.toLowerCase().replace(/\s+/g, '-'),
                    name: businessName,
                    benefits: []
                });
            }
            businessMap.get(businessName).benefits.push(benefit);
        });

        const businesses = Array.from(businessMap.values());

        console.log(`✅ Transformation complete!`);
        console.log(`📊 FINAL RESULT:`);
        console.log(`   - Total benefits loaded: ${allBenefits.length}`);
        console.log(`   - Unique businesses: ${businesses.length}`);
        console.log(`   - Average benefits per business: ${(allBenefits.length / businesses.length).toFixed(1)}`);

        // Show top businesses by benefit count
        console.log(`\n🏆 Top 10 businesses by benefit count:`);
        businesses
            .sort((a, b) => b.benefits.length - a.benefits.length)
            .slice(0, 10)
            .forEach((business, index) => {
                console.log(`   ${index + 1}. ${business.name}: ${business.benefits.length} benefits`);
            });

        // Show sample business
        if (businesses.length > 0) {
            const sampleBusiness = businesses[0];
            console.log(`\n📄 Sample business:`, {
                name: sampleBusiness.name,
                benefitCount: sampleBusiness.benefits.length,
                sampleBenefit: sampleBusiness.benefits[0]?.benefitTitle || 'No title'
            });
        }

        console.log(`\n🎉 SUCCESS: Your Home component will now show ${businesses.length} businesses from all ${allBenefits.length} benefits!`);
        console.log(`   Instead of just 50 benefits, you'll see ALL of them! 🚀`);

        return { allBenefits, businesses };

    } catch (error) {
        console.error('❌ Error simulating Home component:', error);
        return null;
    }
}

simulateHomeComponentLoading();