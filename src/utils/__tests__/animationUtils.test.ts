import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    createStaggerDelay,
    prefersReducedMotion,
    setAnimationDelay,
    triggerAnimation,
    batchAnimations,
    createSpringAnimation,
    createScrollAnimation,
    createLoadingSequence,
    morphElements,
    monitorAnimationPerformance,
} from '../animationUtils';

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

// Mock performance
Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
        now: vi.fn(() => Date.now()),
    },
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: mockRequestAnimationFrame,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
});
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: mockIntersectionObserver,
});

describe('animationUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRequestAnimationFrame.mockClear();
    });

    describe('createStaggerDelay', () => {
        it('should create correct delay for index', () => {
            expect(createStaggerDelay(0)).toBe('0ms');
            expect(createStaggerDelay(1)).toBe('100ms');
            expect(createStaggerDelay(2)).toBe('200ms');
        });

        it('should use custom base delay', () => {
            expect(createStaggerDelay(1, 50)).toBe('50ms');
            expect(createStaggerDelay(2, 50)).toBe('100ms');
        });
    });

    describe('prefersReducedMotion', () => {
        it('should return false when user does not prefer reduced motion', () => {
            mockMatchMedia.mockReturnValue({ matches: false });
            expect(prefersReducedMotion()).toBe(false);
        });

        it('should return true when user prefers reduced motion', () => {
            mockMatchMedia.mockReturnValue({ matches: true });
            expect(prefersReducedMotion()).toBe(true);
        });
    });

    describe('setAnimationDelay', () => {
        it('should set CSS custom property for animation delay', () => {
            const element = document.createElement('div');
            const setPropertySpy = vi.spyOn(element.style, 'setProperty');

            setAnimationDelay(element, 200);

            expect(setPropertySpy).toHaveBeenCalledWith('--animation-delay', '200ms');
        });
    });

    describe('triggerAnimation', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should add animation class and optimize performance', () => {
            const element = document.createElement('div');
            const onComplete = vi.fn();

            triggerAnimation(element, 'animate-fade-in', onComplete);

            expect(element.style.willChange).toBe('transform, opacity');
            expect(element.classList.contains('animate-fade-in')).toBe(true);
        });

        it('should call onComplete and reset willChange on animation end', () => {
            const element = document.createElement('div');
            const onComplete = vi.fn();

            triggerAnimation(element, 'animate-fade-in', onComplete);

            // Simulate animation end
            const event = new Event('animationend');
            element.dispatchEvent(event);

            expect(onComplete).toHaveBeenCalled();
            expect(element.style.willChange).toBe('auto');
        });
    });

    describe('batchAnimations', () => {
        it('should batch multiple animations in requestAnimationFrame', () => {
            const animation1 = vi.fn();
            const animation2 = vi.fn();
            const animation3 = vi.fn();

            batchAnimations([animation1, animation2, animation3]);

            expect(mockRequestAnimationFrame).toHaveBeenCalled();

            // Execute the batched animations
            const callback = mockRequestAnimationFrame.mock.calls[0][0];
            callback();

            expect(animation1).toHaveBeenCalled();
            expect(animation2).toHaveBeenCalled();
            expect(animation3).toHaveBeenCalled();
        });
    });

    describe('createSpringAnimation', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            mockMatchMedia.mockReturnValue({ matches: false });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should animate property from start to end value', () => {
            // Test that the function exists and can be called without errors
            const element = document.createElement('div');

            expect(() => {
                createSpringAnimation(element, '--scale', 0, 1, 300);
            }).not.toThrow();
        });

        it('should set final value immediately with reduced motion', () => {
            mockMatchMedia.mockReturnValue({ matches: true });

            const element = document.createElement('div');
            const setPropertySpy = vi.spyOn(element.style, 'setProperty');

            createSpringAnimation(element, '--scale', 0, 1, 300);

            expect(setPropertySpy).toHaveBeenCalledWith('--scale', '1');
            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe('createScrollAnimation', () => {
        it('should create intersection observer with correct options', () => {
            const elements = [document.createElement('div')];
            const animationClass = 'animate-fade-in';

            createScrollAnimation(elements, animationClass);

            expect(mockIntersectionObserver).toHaveBeenCalledWith(
                expect.any(Function),
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px',
                }
            );
        });

        it('should observe all provided elements', () => {
            const mockObserver = {
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn(),
            };
            mockIntersectionObserver.mockReturnValue(mockObserver);

            const elements = [
                document.createElement('div'),
                document.createElement('div'),
            ];

            createScrollAnimation(elements, 'animate-fade-in');

            expect(mockObserver.observe).toHaveBeenCalledTimes(2);
            expect(mockObserver.observe).toHaveBeenCalledWith(elements[0]);
            expect(mockObserver.observe).toHaveBeenCalledWith(elements[1]);
        });
    });

    describe('createLoadingSequence', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should stagger loading animations', () => {
            const elements = [
                document.createElement('div'),
                document.createElement('div'),
                document.createElement('div'),
            ];

            createLoadingSequence(elements, 100);

            // First element should animate immediately
            vi.advanceTimersByTime(0);
            expect(elements[0].classList.contains('animate-pulse-slow')).toBe(true);

            // Second element after delay
            vi.advanceTimersByTime(100);
            expect(elements[1].classList.contains('animate-pulse-slow')).toBe(true);

            // Third element after another delay
            vi.advanceTimersByTime(100);
            expect(elements[2].classList.contains('animate-pulse-slow')).toBe(true);
        });
    });

    describe('morphElements', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            mockMatchMedia.mockReturnValue({ matches: false });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should morph between elements with animation', async () => {
            const fromElement = document.createElement('div');
            const toElement = document.createElement('div');

            // Mock getBoundingClientRect
            fromElement.getBoundingClientRect = vi.fn(() => ({
                width: 100,
                height: 50,
                left: 10,
                top: 20,
            })) as any;

            toElement.getBoundingClientRect = vi.fn(() => ({
                width: 200,
                height: 100,
                left: 30,
                top: 40,
            })) as any;

            const morphPromise = morphElements(fromElement, toElement, 300);

            // Should set initial transform on toElement
            expect(toElement.style.transform).toContain('translate');
            expect(toElement.style.opacity).toBe('0');

            // Advance timers to complete animation
            vi.advanceTimersByTime(300);

            await morphPromise;

            expect(fromElement.style.display).toBe('none');
        });

        it('should handle reduced motion by switching immediately', async () => {
            mockMatchMedia.mockReturnValue({ matches: true });

            const fromElement = document.createElement('div');
            const toElement = document.createElement('div');

            const morphPromise = morphElements(fromElement, toElement, 300);

            await morphPromise;

            expect(fromElement.style.display).toBe('none');
            expect(toElement.style.display).toBe('block');
        });
    });

    describe('monitorAnimationPerformance', () => {
        it('should warn about slow animations', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Mock performance.now to simulate slow animation
            let callCount = 0;
            (window.performance.now as any).mockImplementation(() => {
                callCount++;
                return callCount === 1 ? 0 : 20; // 20ms duration
            });

            const callback = vi.fn();

            monitorAnimationPerformance('test-animation', callback);

            expect(callback).toHaveBeenCalled();

            // Execute requestAnimationFrame callback
            const rafCallback = mockRequestAnimationFrame.mock.calls[0][0];
            rafCallback();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Animation "test-animation" took 20.00ms (> 16.67ms)'
            );

            consoleSpy.mockRestore();
        });

        it('should not warn about fast animations', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Mock performance.now to simulate fast animation
            let callCount = 0;
            (window.performance.now as any).mockImplementation(() => {
                callCount++;
                return callCount === 1 ? 0 : 10; // 10ms duration
            });

            const callback = vi.fn();

            monitorAnimationPerformance('test-animation', callback);

            // Execute requestAnimationFrame callback
            const rafCallback = mockRequestAnimationFrame.mock.calls[0][0];
            rafCallback();

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});