import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to detect user's motion preferences
 */
export const useReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
};

/**
 * Hook for managing element visibility with animation
 */
export const useAnimatedVisibility = (
    isVisible: boolean,
    duration: number = 250
) => {
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            // Small delay to ensure element is rendered before animation
            requestAnimationFrame(() => {
                setAnimationClass('animate-fade-in');
            });
        } else {
            setAnimationClass('animate-fade-out');
            const timer = setTimeout(() => {
                setShouldRender(false);
                setAnimationClass('');
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration]);

    return { shouldRender, animationClass };
};

/**
 * Hook for staggered animations
 */
export const useStaggeredAnimation = (
    itemCount: number,
    delay: number = 100
) => {
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

    const triggerStagger = useCallback(() => {
        setVisibleItems(new Set());

        for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, i]));
            }, i * delay);
        }
    }, [itemCount, delay]);

    const isItemVisible = useCallback((index: number) => {
        return visibleItems.has(index);
    }, [visibleItems]);

    return { triggerStagger, isItemVisible };
};

/**
 * Hook for intersection observer based animations
 */
export const useInViewAnimation = (
    threshold: number = 0.1,
    rootMargin: string = '0px'
) => {
    const [isInView, setIsInView] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setIsInView(true);
                    setHasAnimated(true);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.unobserve(element);
    }, [threshold, rootMargin, hasAnimated]);

    return { elementRef, isInView };
};

/**
 * Hook for managing loading animations
 */
export const useLoadingAnimation = (isLoading: boolean) => {
    const [animationState, setAnimationState] = useState<'idle' | 'loading' | 'success'>('idle');

    useEffect(() => {
        if (isLoading) {
            setAnimationState('loading');
        } else if (animationState === 'loading') {
            setAnimationState('success');
            // Reset to idle after success animation
            const timer = setTimeout(() => {
                setAnimationState('idle');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, animationState]);

    const getLoadingClass = () => {
        switch (animationState) {
            case 'loading':
                return 'animate-pulse-slow';
            case 'success':
                return 'animate-bounce-in';
            default:
                return '';
        }
    };

    return { animationState, getLoadingClass };
};

/**
 * Hook for managing hover animations with performance optimization
 */
export const useHoverAnimation = () => {
    const [isHovered, setIsHovered] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleMouseEnter = () => {
            element.style.willChange = 'transform';
            setIsHovered(true);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
            // Remove will-change after animation completes
            setTimeout(() => {
                if (element) {
                    element.style.willChange = 'auto';
                }
            }, 250);
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return { elementRef, isHovered };
};

/**
 * Hook for managing focus animations
 */
export const useFocusAnimation = () => {
    const [isFocused, setIsFocused] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);

        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);

        return () => {
            element.removeEventListener('focus', handleFocus);
            element.removeEventListener('blur', handleBlur);
        };
    }, []);

    return { elementRef, isFocused };
};

/**
 * Animation timing utilities
 */
export const animationTimings = {
    micro: 150,
    short: 250,
    medium: 300,
    long: 500,
} as const;

/**
 * Easing functions for JavaScript animations
 */
export const easingFunctions = {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;