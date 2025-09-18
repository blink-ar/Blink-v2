import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    useReducedMotion,
    useAnimatedVisibility,
    useStaggeredAnimation,
    useLoadingAnimation,
} from '../useAnimation';

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: vi.fn((cb) => setTimeout(cb, 16)),
});

describe('useReducedMotion', () => {
    beforeEach(() => {
        mockMatchMedia.mockClear();
    });

    it('should return false when user does not prefer reduced motion', () => {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
        mockMatchMedia.mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(true);
    });

    it('should update when media query changes', () => {
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();

        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener,
            removeEventListener,
        });

        const { result, unmount } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);

        // Simulate media query change
        const changeHandler = addEventListener.mock.calls[0][1];
        act(() => {
            changeHandler({ matches: true });
        });

        expect(result.current).toBe(true);

        unmount();
        expect(removeEventListener).toHaveBeenCalled();
    });
});

describe('useAnimatedVisibility', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should show element when isVisible is true', () => {
        const { result } = renderHook(() => useAnimatedVisibility(true));

        expect(result.current.shouldRender).toBe(true);

        act(() => {
            vi.advanceTimersByTime(16); // requestAnimationFrame
        });

        expect(result.current.animationClass).toBe('animate-fade-in');
    });

    it('should hide element when isVisible is false', () => {
        const { result, rerender } = renderHook(
            ({ isVisible }) => useAnimatedVisibility(isVisible),
            { initialProps: { isVisible: true } }
        );

        expect(result.current.shouldRender).toBe(true);

        rerender({ isVisible: false });
        expect(result.current.animationClass).toBe('animate-fade-out');

        act(() => {
            vi.advanceTimersByTime(250); // Default duration
        });

        expect(result.current.shouldRender).toBe(false);
    });

    it('should respect custom duration', () => {
        const { result, rerender } = renderHook(
            ({ isVisible }) => useAnimatedVisibility(isVisible, 500),
            { initialProps: { isVisible: true } }
        );

        rerender({ isVisible: false });
        expect(result.current.shouldRender).toBe(true);

        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(result.current.shouldRender).toBe(true);

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.shouldRender).toBe(false);
    });
});

describe('useStaggeredAnimation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should stagger item visibility', () => {
        const { result } = renderHook(() => useStaggeredAnimation(3, 100));

        expect(result.current.isItemVisible(0)).toBe(false);
        expect(result.current.isItemVisible(1)).toBe(false);
        expect(result.current.isItemVisible(2)).toBe(false);

        act(() => {
            result.current.triggerStagger();
        });

        // First item should be visible immediately
        act(() => {
            vi.advanceTimersByTime(0);
        });
        expect(result.current.isItemVisible(0)).toBe(true);
        expect(result.current.isItemVisible(1)).toBe(false);

        // Second item after delay
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.isItemVisible(1)).toBe(true);
        expect(result.current.isItemVisible(2)).toBe(false);

        // Third item after another delay
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.isItemVisible(2)).toBe(true);
    });
});

describe('useLoadingAnimation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should handle loading states', () => {
        const { result, rerender } = renderHook(
            ({ isLoading }) => useLoadingAnimation(isLoading),
            { initialProps: { isLoading: false } }
        );

        expect(result.current.animationState).toBe('idle');
        expect(result.current.getLoadingClass()).toBe('');

        // Start loading
        rerender({ isLoading: true });
        expect(result.current.animationState).toBe('loading');
        expect(result.current.getLoadingClass()).toBe('animate-pulse-slow');

        // Finish loading
        rerender({ isLoading: false });
        expect(result.current.animationState).toBe('success');
        expect(result.current.getLoadingClass()).toBe('animate-bounce-in');

        // The state should remain 'success' until the timer completes
        expect(result.current.animationState).toBe('success');
    });
});