/**
 * Animation utility functions for common animation patterns
 */

/**
 * Creates a staggered delay for multiple elements
 */
export const createStaggerDelay = (index: number, baseDelay: number = 100): string => {
    return `${index * baseDelay}ms`;
};

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Creates a CSS custom property for animation delay
 */
export const setAnimationDelay = (element: HTMLElement, delay: number): void => {
    element.style.setProperty('--animation-delay', `${delay}ms`);
};

/**
 * Performance-optimized animation trigger
 */
export const triggerAnimation = (
    element: HTMLElement,
    animationClass: string,
    onComplete?: () => void
): void => {
    // Optimize for performance
    element.style.willChange = 'transform, opacity';

    element.classList.add(animationClass);

    const handleAnimationEnd = () => {
        element.style.willChange = 'auto';
        element.removeEventListener('animationend', handleAnimationEnd);
        onComplete?.();
    };

    element.addEventListener('animationend', handleAnimationEnd);
};

/**
 * Batch DOM updates for better performance
 */
export const batchAnimations = (animations: (() => void)[]): void => {
    requestAnimationFrame(() => {
        animations.forEach(animation => animation());
    });
};

/**
 * Creates a spring animation using CSS custom properties
 */
export const createSpringAnimation = (
    element: HTMLElement,
    property: string,
    from: number,
    to: number,
    duration: number = 300
): void => {
    if (prefersReducedMotion()) {
        element.style.setProperty(property, `${to}`);
        return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;

        element.style.setProperty(property, `${current}`);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
};

/**
 * Intersection Observer for scroll-triggered animations
 */
export const createScrollAnimation = (
    elements: HTMLElement[],
    animationClass: string,
    options: IntersectionObserverInit = {}
): IntersectionObserver => {
    const defaultOptions: IntersectionObserverInit = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                triggerAnimation(element, animationClass);
                observer.unobserve(element);
            }
        });
    }, defaultOptions);

    elements.forEach(element => observer.observe(element));

    return observer;
};

/**
 * Creates a loading animation sequence
 */
export const createLoadingSequence = (
    elements: HTMLElement[],
    staggerDelay: number = 100
): void => {
    elements.forEach((element, index) => {
        setTimeout(() => {
            triggerAnimation(element, 'animate-pulse-slow');
        }, index * staggerDelay);
    });
};

/**
 * Morphing animation between two states
 */
export const morphElements = (
    fromElement: HTMLElement,
    toElement: HTMLElement,
    duration: number = 300
): Promise<void> => {
    return new Promise((resolve) => {
        if (prefersReducedMotion()) {
            fromElement.style.display = 'none';
            toElement.style.display = 'block';
            resolve();
            return;
        }

        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        // Calculate transform values
        const scaleX = fromRect.width / toRect.width;
        const scaleY = fromRect.height / toRect.height;
        const translateX = fromRect.left - toRect.left;
        const translateY = fromRect.top - toRect.top;

        // Set initial state for toElement
        toElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        toElement.style.opacity = '0';
        toElement.style.display = 'block';

        // Animate fromElement out
        fromElement.style.transition = `opacity ${duration}ms ease-out`;
        fromElement.style.opacity = '0';

        // Animate toElement in
        requestAnimationFrame(() => {
            toElement.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms ease-out`;
            toElement.style.transform = 'translate(0, 0) scale(1, 1)';
            toElement.style.opacity = '1';
        });

        setTimeout(() => {
            fromElement.style.display = 'none';
            fromElement.style.transition = '';
            fromElement.style.opacity = '';

            toElement.style.transition = '';
            toElement.style.transform = '';
            resolve();
        }, duration);
    });
};

/**
 * Animation performance monitoring
 */
export const monitorAnimationPerformance = (
    animationName: string,
    callback: () => void
): void => {
    const startTime = performance.now();

    callback();

    requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (duration > 16.67) { // More than one frame at 60fps
            console.warn(`Animation "${animationName}" took ${duration.toFixed(2)}ms (> 16.67ms)`);
        }
    });
};

/**
 * CSS class animation utilities
 */
export const animationClasses = {
    // Entrance animations
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    scaleIn: 'animate-scale-in',
    bounceIn: 'animate-bounce-in',

    // Exit animations
    fadeOut: 'animate-fade-out',
    scaleOut: 'animate-scale-out',

    // Loading animations
    shimmer: 'animate-shimmer',
    pulseSlow: 'animate-pulse-slow',

    // Transition utilities
    transitionAll: 'transition-all-smooth',
    transitionTransform: 'transition-transform-smooth',
    transitionColors: 'transition-colors-smooth',
    transitionShadow: 'transition-shadow-smooth',

    // Interactive states
    hoverLift: 'hover-lift',
    hoverScale: 'hover-scale',
    activeScale: 'active-scale',
    focusRing: 'focus-ring',

    // Performance optimizations
    willChangeTransform: 'will-change-transform',
    willChangeOpacity: 'will-change-opacity',
    gpuAccelerated: 'gpu-accelerated',
} as const;

export type AnimationClass = typeof animationClasses[keyof typeof animationClasses];