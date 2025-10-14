import { useState, useEffect } from 'react';

interface BreakpointConfig {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
}

const breakpoints: BreakpointConfig = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    '3xl': 1600,
};

export type Breakpoint = keyof BreakpointConfig;

export const useResponsive = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getCurrentBreakpoint = (): Breakpoint => {
        const width = windowSize.width;

        if (width >= breakpoints['3xl']) return '3xl';
        if (width >= breakpoints['2xl']) return '2xl';
        if (width >= breakpoints.xl) return 'xl';
        if (width >= breakpoints.lg) return 'lg';
        if (width >= breakpoints.md) return 'md';
        if (width >= breakpoints.sm) return 'sm';
        return 'xs';
    };

    const isBreakpoint = (breakpoint: Breakpoint): boolean => {
        return windowSize.width >= breakpoints[breakpoint];
    };

    const isMobile = windowSize.width < breakpoints.md;
    const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
    const isDesktop = windowSize.width >= breakpoints.lg;

    return {
        windowSize,
        currentBreakpoint: getCurrentBreakpoint(),
        isBreakpoint,
        isMobile,
        isTablet,
        isDesktop,
        breakpoints,
    };
};