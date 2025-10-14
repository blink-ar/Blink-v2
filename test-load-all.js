// Simple test to demonstrate loading all benefits
// Run this with: node test-load-all.js

const BASE_URL = 'http://localhost:3002';

async function fetchAllBenefitsDemo() {
    console.log('🚀 Demo: Loading ALL benefits using pagination...\n');

    try {
        const allBenefits = [];
        let offset = 0;
        const limit = 200; // Efficient chunk size
        let hasMore = true;
        let pageCount = 0;

        console.time('⏱️ Total loading time');

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
        console.log(`\n🎯 RESULT: Successfully loaded ${allBenefits.length} benefits in ${pageCount} pages`);

        // Show some sample data
        if (allBenefits.length > 0) {
            console.log('\n📊 Sample benefits:');
            for (let i = 0; i < Math.min(5, allBenefits.length); i++) {
                const benefit = allBenefits[i];
                console.log(`  ${i + 1}. ${benefit.merchant?.name || 'Unknown'} - ${benefit.benefitTitle || 'No title'}`);
            }

            console.log(`\n📈 Benefits by bank:`);
            const bankCounts = {};
            allBenefits.forEach(benefit => {
                const bank = benefit.bank || 'Unknown';
                bankCounts[bank] = (bankCounts[bank] || 0) + 1;
            });

            Object.entries(bankCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .forEach(([bank, count]) => {
                    console.log(`  ${bank}: ${count} benefits`);
                });
        }

        return allBenefits;

    } catch (error) {
        console.error('❌ Error loading all benefits:', error);
        return [];
    }
}

// Run the demo
fetchAllBenefitsDemo();