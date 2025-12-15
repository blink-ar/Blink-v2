// Debug script to check business benefits
// Run this in the browser console on the business page

console.log('=== DEBUGGING BUSINESS BENEFITS ===');

// Check if business object exists in global scope or can be accessed
if (typeof business !== 'undefined') {
    console.log('Business found:', business);
    console.log('Benefits count:', business.benefits?.length || 0);
    console.log('All benefits:', business.benefits);
} else {
    console.log('Business not found in global scope');
}

// Check localStorage or sessionStorage for business data
const storageKeys = Object.keys(localStorage);
console.log('LocalStorage keys:', storageKeys);

// Check if there's any business data in storage
storageKeys.forEach(key => {
    if (key.includes('business') || key.includes('benefit')) {
        console.log(`Storage ${key}:`, localStorage.getItem(key));
    }
});

// Check the current URL to understand which business we're looking at
console.log('Current URL:', window.location.href);
console.log('URL params:', new URLSearchParams(window.location.search));

// Check if there are any React DevTools or similar that can help
console.log('Available global objects:', Object.keys(window).filter(key =>
    key.includes('React') || key.includes('business') || key.includes('benefit')
));