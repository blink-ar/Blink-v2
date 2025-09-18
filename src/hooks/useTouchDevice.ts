import { useState, useEffect } from 'react';

export const useTouchDevice = () => {
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [hasCoarsePointer, setHasCoarsePointer] = useState(false);

    useEffect(() => {
        // Check for touch support
        const checkTouchSupport = () => {
            // Multiple ways to detect touch support
            const hasTouchEvents = 'ontouchstart' in window;
            const hasPointerEvents = 'onpointerdown' in window;
            const hasMSPointerEvents = 'onmspointerdown' in window;

            // Check for coarse pointer (typically touch)
            const mediaQuery = window.matchMedia('(pointer: coarse)');
            setHasCoarsePointer(mediaQuery.matches);

            // Combine checks for more reliable detection
            const touchSupported = hasTouchEvents || hasPointerEvents || hasMSPointerEvents;

            // Additional check for mobile user agents
            const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

            setIsTouchDevice(touchSupported || mobileUserAgent || mediaQuery.matches);
        };

        checkTouchSupport();

        // Listen for changes in pointer type
        const mediaQuery = window.matchMedia('(pointer: coarse)');
        const handleChange = (e: MediaQueryListEvent) => {
            setHasCoarsePointer(e.matches);
            setIsTouchDevice(prev => prev || e.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    return {
        isTouchDevice,
        hasCoarsePointer,
        // Convenience flags
        isPrimaryTouch: hasCoarsePointer,
        isLikelyMobile: isTouchDevice && hasCoarsePointer
    };
};