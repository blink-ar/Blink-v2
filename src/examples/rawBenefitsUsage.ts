/**
 * Example: Using Raw Benefits Data (Exact API Format)
 * 
 * This file demonstrates how to work with benefits data in the exact format
 * as returned by the API (data.benefits) without any transformation.
 */

import {
    getRawBenefits,
    getAllRawBenefits,
    getRawBenefitsByBank,
    getRawBenefitsByCategory,
    getRawBenefitsWithLimit
} from '../services/rawBenefitsApi';
import { RawMongoBenefit } from '../types/mongodb';

// Example 1: Get raw benefits with limit
export async function exampleGetRawBenefits() {
    console.log('📊 Example: Getting raw benefits with limit...');

    const rawBenefits = await getRawBenefitsWithLimit(10);

    console.log('Raw benefits received:', {
        count: rawBenefits.length,
        firstBenefit: rawBenefits[0] || null
    });

    return rawBenefits;
}

// Example 2: Filter raw benefits by bank
export async function exampleFilterByBank(bankName: string) {
    console.log(`🏦 Example: Getting raw benefits for bank: ${bankName}`);

    const bankBenefits = await getRawBenefitsByBank(bankName, 20);

    console.log(`Raw benefits for ${bankName}:`, {
        count: bankBenefits.length,
        merchants: [...new Set(bankBenefits.map(b => b.merchant?.name))],
        categories: [...new Set(bankBenefits.flatMap(b => b.categories || []))]
    });

    return bankBenefits;
}

// Example 3: Filter raw benefits by category
export async function exampleFilterByCategory(category: string) {
    console.log(`🏷️ Example: Getting raw benefits for category: ${category}`);

    const categoryBenefits = await getRawBenefitsByCategory(category, 15);

    console.log(`Raw benefits for ${category}:`, {
        count: categoryBenefits.length,
        banks: [...new Set(categoryBenefits.map(b => b.bank))],
        merchants: [...new Set(categoryBenefits.map(b => b.merchant?.name))]
    });

    return categoryBenefits;
}

// Example 4: Process raw benefits data
export function processRawBenefits(rawBenefits: RawMongoBenefit[]) {
    console.log('🔄 Example: Processing raw benefits data...');

    // Extract unique merchants
    const uniqueMerchants = [...new Set(rawBenefits.map(b => b.merchant?.name))].filter(Boolean);

    // Extract unique banks
    const uniqueBanks = [...new Set(rawBenefits.map(b => b.bank))].filter(Boolean);

    // Extract unique categories
    const uniqueCategories = [...new Set(rawBenefits.flatMap(b => b.categories || []))];

    // Group by bank
    const benefitsByBank = rawBenefits.reduce((acc, benefit) => {
        const bank = benefit.bank;
        if (!acc[bank]) {
            acc[bank] = [];
        }
        acc[bank].push(benefit);
        return acc;
    }, {} as Record<string, RawMongoBenefit[]>);

    // Group by merchant
    const benefitsByMerchant = rawBenefits.reduce((acc, benefit) => {
        const merchant = benefit.merchant?.name || 'Unknown';
        if (!acc[merchant]) {
            acc[merchant] = [];
        }
        acc[merchant].push(benefit);
        return acc;
    }, {} as Record<string, RawMongoBenefit[]>);

    // Calculate statistics
    const stats = {
        totalBenefits: rawBenefits.length,
        uniqueMerchants: uniqueMerchants.length,
        uniqueBanks: uniqueBanks.length,
        uniqueCategories: uniqueCategories.length,
        onlineBenefits: rawBenefits.filter(b => b.online).length,
        benefitsWithDiscount: rawBenefits.filter(b => b.discountPercentage && b.discountPercentage > 0).length,
        averageDiscount: rawBenefits
            .filter(b => b.discountPercentage && b.discountPercentage > 0)
            .reduce((sum, b) => sum + (b.discountPercentage || 0), 0) /
            rawBenefits.filter(b => b.discountPercentage && b.discountPercentage > 0).length || 0
    };

    console.log('📊 Raw benefits analysis:', {
        stats,
        uniqueMerchants: uniqueMerchants.slice(0, 10), // Show first 10
        uniqueBanks,
        uniqueCategories,
        topBanksByBenefits: Object.entries(benefitsByBank)
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 5)
            .map(([bank, benefits]) => ({ bank, count: benefits.length })),
        topMerchantsByBenefits: Object.entries(benefitsByMerchant)
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 5)
            .map(([merchant, benefits]) => ({ merchant, count: benefits.length }))
    });

    return {
        stats,
        uniqueMerchants,
        uniqueBanks,
        uniqueCategories,
        benefitsByBank,
        benefitsByMerchant
    };
}

// Example 5: Search raw benefits
export function searchRawBenefits(rawBenefits: RawMongoBenefit[], searchTerm: string) {
    console.log(`🔍 Example: Searching raw benefits for: "${searchTerm}"`);

    const searchLower = searchTerm.toLowerCase();

    const results = rawBenefits.filter(benefit =>
        benefit.merchant?.name?.toLowerCase().includes(searchLower) ||
        benefit.benefitTitle?.toLowerCase().includes(searchLower) ||
        benefit.description?.toLowerCase().includes(searchLower) ||
        benefit.bank?.toLowerCase().includes(searchLower) ||
        benefit.categories?.some(cat => cat.toLowerCase().includes(searchLower))
    );

    console.log(`Search results for "${searchTerm}":`, {
        totalResults: results.length,
        merchants: [...new Set(results.map(b => b.merchant?.name))].slice(0, 5),
        banks: [...new Set(results.map(b => b.bank))],
        categories: [...new Set(results.flatMap(b => b.categories || []))]
    });

    return results;
}

// Example 6: Get benefit details in raw format
export function getBenefitDetails(rawBenefit: RawMongoBenefit) {
    console.log('📋 Example: Getting benefit details in raw format...');

    const details = {
        id: rawBenefit._id?.$oid,
        merchant: {
            name: rawBenefit.merchant?.name,
            type: rawBenefit.merchant?.type
        },
        bank: rawBenefit.bank,
        network: rawBenefit.network,
        cardTypes: rawBenefit.cardTypes?.map(ct => ({
            name: ct.name,
            category: ct.category,
            mode: ct.mode
        })),
        benefit: {
            title: rawBenefit.benefitTitle,
            description: rawBenefit.description,
            discountPercentage: rawBenefit.discountPercentage,
            validUntil: rawBenefit.validUntil
        },
        categories: rawBenefit.categories,
        location: {
            address: rawBenefit.location,
            online: rawBenefit.online
        },
        availability: {
            days: rawBenefit.availableDays,
            link: rawBenefit.link
        },
        terms: rawBenefit.termsAndConditions,
        metadata: {
            originalId: rawBenefit.originalId,
            sourceCollection: rawBenefit.sourceCollection,
            processedAt: rawBenefit.processedAt,
            processingStatus: rawBenefit.processingStatus
        }
    };

    console.log('Benefit details (raw format):', details);

    return details;
}

// Example usage function
export async function runRawBenefitsExamples() {
    console.log('🚀 Running raw benefits examples...');

    try {
        // Get some raw benefits
        const rawBenefits = await exampleGetRawBenefits();

        if (rawBenefits.length > 0) {
            // Process the data
            const analysis = processRawBenefits(rawBenefits);

            // Search example
            const searchResults = searchRawBenefits(rawBenefits, 'restaurant');

            // Get details of first benefit
            const firstBenefitDetails = getBenefitDetails(rawBenefits[0]);

            // Filter by bank example
            if (analysis.uniqueBanks.length > 0) {
                await exampleFilterByBank(analysis.uniqueBanks[0]);
            }

            // Filter by category example
            if (analysis.uniqueCategories.length > 0) {
                await exampleFilterByCategory(analysis.uniqueCategories[0]);
            }

            console.log('✅ All raw benefits examples completed successfully!');
        } else {
            console.log('⚠️ No raw benefits found to process');
        }
    } catch (error) {
        console.error('❌ Error running raw benefits examples:', error);
    }
}