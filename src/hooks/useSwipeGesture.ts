import { useState, useRef, useCallback } from 'react';

interface SwipeConfig {
    threshold?: number; // Minimum distance for swipe
    velocityThreshold?: number; // Minimum velocity for swipe
    preventDefaultTouchmoveEvent?: boolean;
    trackMouse?: boolean; // Also track mouse events for desktop testing
}

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onSwipeStart?: (event: TouchEvent | MouseEvent) => void;
    onSwipeEnd?: (event: TouchEvent | MouseEvent) => void;
}

interface SwipeState {
    startX: number;
    startY: number;
    startTime: number;
    isSwiping: boolean;
}

export const useSwipeGesture = (
    handlers: SwipeHandlers,
    config: SwipeConfig = {}
) => {
    const {
        threshold = 50,
        velocityThreshold = 0.3,
        preventDefaultTouchmoveEvent = false,
        trackMouse = false
    } = config;

    const [swipeState, setSwipeState] = useState<SwipeState>({
        startX: 0,
        startY: 0,
        startTime: 0,
        isSwiping: false
    });

    const elementRef = useRef<HTMLElement>(null);

    const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        setSwipeState({
            startX: clientX,
            startY: clientY,
            startTime: Date.now(),
            isSwiping: true
        });

        handlers.onSwipeStart?.(event);
    }, [handlers]);

    const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
        if (!swipeState.isSwiping) return;

        const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX;
        const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY;

        const deltaX = clientX - swipeState.startX;
        const deltaY = clientY - swipeState.startY;
        const deltaTime = Date.now() - swipeState.startTime;

        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Check if swipe meets threshold and velocity requirements
        if (velocity >= velocityThreshold && (absX >= threshold || absY >= threshold)) {
            // Determine swipe direction (prioritize the larger delta)
            if (absX > absY) {
                // Horizontal swipe
                if (deltaX > 0) {
                    handlers.onSwipeRight?.();
                } else {
                    handlers.onSwipeLeft?.();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    handlers.onSwipeDown?.();
                } else {
                    handlers.onSwipeUp?.();
                }
            }
        }

        setSwipeState(prev => ({ ...prev, isSwiping: false }));
        handlers.onSwipeEnd?.(event);
    }, [swipeState, handlers, threshold, velocityThreshold]);

    const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
        if (preventDefaultTouchmoveEvent && 'touches' in event) {
            event.preventDefault();
        }
    }, [preventDefaultTouchmoveEvent]);

    // Touch event handlers
    const touchHandlers = {
        onTouchStart: handleStart,
        onTouchEnd: handleEnd,
        onTouchMove: handleMove
    };

    // Mouse event handlers (for desktop testing)
    const mouseHandlers = trackMouse ? {
        onMouseDown: handleStart,
        onMouseUp: handleEnd,
        onMouseMove: handleMove
    } : {};

    return {
        ref: elementRef,
        handlers: {
            ...touchHandlers,
            ...mouseHandlers
        },
        swipeState
    };
};