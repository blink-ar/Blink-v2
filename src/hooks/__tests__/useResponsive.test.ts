import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '../useResponsive';

// Mock window.innerWidth and window.innerHeight
const mockWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
    });
};

describe('useResponsive', () => {
    beforeEach(() => {
        // Reset to default desktop size
        mockWindowSize(1024, 768);
    });

    it('returns correct breakpoint for mobile', () => {
        mockWindowSize(400, 600);
        const { result } = renderHook(() => useResponsive());

        expect(result.current.currentBreakpoint).toBe('xs');
        expect(result.current.isMobile).toBe(true);
        expect(result.current.isTablet).toBe(false);
        expect(result.current.isDesktop).toBe(false);
    });

    it('returns correct breakpoint for tablet', () => {
        mockWindowSize(800, 600);
        const { result } = renderHook(() => useResponsive());

        expect(result.current.currentBreakpoint).toBe('md');
        expect(result.current.isMobile).toBe(false);
        expect(result.current.isTablet).toBe(true);
        expect(result.current.isDesktop).toBe(false);
    });

    it('returns correct breakpoint for desktop', () => {
        mockWindowSize(1300, 800); // xl breakpoint is 1280px
        const { result } = renderHook(() => useResponsive());

        expect(result.current.currentBreakpoint).toBe('xl');
        expect(result.current.isMobile).toBe(false);
        expect(result.current.isTablet).toBe(false);
        expect(result.current.isDesktop).toBe(true);
    });

    it('updates on window resize', () => {
        const { result } = renderHook(() => useResponsive());

        // Start with desktop
        expect(result.current.currentBreakpoint).toBe('lg');

        // Resize to mobile
        act(() => {
            mockWindowSize(400, 600);
            window.dispatchEvent(new Event('resize'));
        });

        expect(result.current.currentBreakpoint).toBe('xs');
        expect(result.current.isMobile).toBe(true);
    });

    it('isBreakpoint function works correctly', () => {
        mockWindowSize(800, 600);
        const { result } = renderHook(() => useResponsive());

        expect(result.current.isBreakpoint('xs')).toBe(true);
        expect(result.current.isBreakpoint('sm')).toBe(true);
        expect(result.current.isBreakpoint('md')).toBe(true);
        expect(result.current.isBreakpoint('lg')).toBe(false);
        expect(result.current.isBreakpoint('xl')).toBe(false);
    });
});