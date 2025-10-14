import { fetchAllBenefitsEfficient, fetchAllBusinessesComplete } from '../services/api';
import { Business } from '../types';
import { Benefit } from '../types/mongodb';

/**
 * Utility to load all benefits at once
 * Use this when you need all 1,714 benefits instead of paginated loading
 */
export async function loadAllBenefits(): Promise<Benefit[]> {
    console.log('🚀 loadAllBenefits: Loading ALL benefits...');
    try {
        const allBenefits = await fetchAllBenefitsEfficient();
        console.log(`✅ loadAllBenefits: Successfully loaded ${allBenefits.length} benefits`);
        return allBenefits;
    } catch (error) {
        console.error('❌ loadAllBenefits: Failed to load all benefits:', error);
        throw error;
    }
}

/**
 * Utility to load all businesses at once (converted from benefits)
 * Use this when you need all businesses instead of paginated loading
 */
export async function loadAllBusinesses(): Promise<Business[]> {
    console.log('🚀 loadAllBusinesses: Loading ALL businesses...');
    try {
        const allBusinesses = await fetchAllBusinessesComplete();
        console.log(`✅ loadAllBusinesses: Successfully loaded ${allBusinesses.length} businesses`);
        return allBusinesses;
    } catch (error) {
        console.error('❌ loadAllBusinesses: Failed to load all businesses:', error);
        throw error;
    }
}

/**
 * Test function to compare loading methods
 */
export async function testLoadingMethods() {
    console.log('🧪 Testing different loading methods...\n');

    try {
        // Test loading all benefits
        console.time('⏱️ Load All Benefits');
        const allBenefits = await loadAllBenefits();
        console.timeEnd('⏱️ Load All Benefits');
        console.log(`📊 Total benefits loaded: ${allBenefits.length}\n`);

        // Test loading all businesses
        console.time('⏱️ Load All Businesses');
        const allBusinesses = await loadAllBusinesses();
        console.timeEnd('⏱️ Load All Businesses');
        console.log(`📊 Total businesses loaded: ${allBusinesses.length}\n`);

        // Show sample data
        if (allBenefits.length > 0) {
            console.log('📄 Sample benefit:', {
                id: allBenefits[0].id,
                merchant: allBenefits[0].merchant.name,
                bank: allBenefits[0].bank,
                benefitTitle: allBenefits[0].benefitTitle
            });
        }

        if (allBusinesses.length > 0) {
            console.log('📄 Sample business:', {
                id: allBusinesses[0].id,
                name: allBusinesses[0].name,
                benefitsCount: allBusinesses[0].benefits.length
            });
        }

        return { allBenefits, allBusinesses };
    } catch (error) {
        console.error('❌ testLoadingMethods: Error:', error);
        throw error;
    }
}