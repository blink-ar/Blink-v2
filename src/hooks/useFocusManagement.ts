import { useEffect, useRef, useCallback } from 'react';

// Hook for managing focus in components
export const useFocusManagement = () => {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Store the currently focused element
    const storeFocus = useCallback(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
    }, []);

    // Restore focus to the previously focused element
    const restoreFocus = useCallback(() => {
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
            previousFocusRef.current.focus();
        }
    }, []);

    // Focus the first focusable element in a container
    const focusFirstElement = useCallback((container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
        }
    }, []);

    // Focus the last focusable element in a container
    const focusLastElement = useCallback((container: HTMLElement) => {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
        }
    }, []);

    return {
        storeFocus,
        restoreFocus,
        focusFirstElement,
        focusLastElement,
    };
};

// Hook for keyboard navigation in lists/grids
export const useKeyboardNavigation = (
    itemsRef: React.RefObject<HTMLElement[]>,
    orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
    gridColumns?: number
) => {
    const currentIndexRef = useRef(0);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!itemsRef.current) return;

        const items = itemsRef.current;
        const { key } = event;
        let newIndex = currentIndexRef.current;

        switch (orientation) {
            case 'horizontal':
                if (key === 'ArrowLeft') {
                    event.preventDefault();
                    newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
                } else if (key === 'ArrowRight') {
                    event.preventDefault();
                    newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
                }
                break;

            case 'vertical':
                if (key === 'ArrowUp') {
                    event.preventDefault();
                    newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
                } else if (key === 'ArrowDown') {
                    event.preventDefault();
                    newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
                }
                break;

            case 'grid':
                if (!gridColumns) return;

                if (key === 'ArrowLeft') {
                    event.preventDefault();
                    newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
                } else if (key === 'ArrowRight') {
                    event.preventDefault();
                    newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
                } else if (key === 'ArrowUp') {
                    event.preventDefault();
                    newIndex = newIndex >= gridColumns ? newIndex - gridColumns : newIndex;
                } else if (key === 'ArrowDown') {
                    event.preventDefault();
                    const maxIndex = items.length - 1;
                    const nextIndex = newIndex + gridColumns;
                    newIndex = nextIndex <= maxIndex ? nextIndex : newIndex;
                }
                break;
        }

        // Handle Home and End keys
        if (key === 'Home') {
            event.preventDefault();
            newIndex = 0;
        } else if (key === 'End') {
            event.preventDefault();
            newIndex = items.length - 1;
        }

        // Update focus if index changed
        if (newIndex !== currentIndexRef.current) {
            currentIndexRef.current = newIndex;
            items[newIndex]?.focus();
        }
    }, [itemsRef, orientation, gridColumns]);

    const setCurrentIndex = useCallback((index: number) => {
        currentIndexRef.current = index;
    }, []);

    return {
        handleKeyDown,
        setCurrentIndex,
        currentIndex: currentIndexRef.current,
    };
};

// Hook for managing modal focus trap
export const useModalFocusTrap = (isOpen: boolean, onClose?: () => void) => {
    const modalRef = useRef<HTMLElement>(null);
    const { storeFocus, restoreFocus, focusFirstElement } = useFocusManagement();

    useEffect(() => {
        if (!isOpen) return;

        // Store current focus and focus first element in modal
        storeFocus();

        if (modalRef.current) {
            focusFirstElement(modalRef.current);
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && onClose) {
                onClose();
                return;
            }

            if (event.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (event.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            restoreFocus();
        };
    }, [isOpen, onClose, storeFocus, restoreFocus, focusFirstElement]);

    return modalRef;
};

// Hook for managing roving tabindex in component groups
export const useRovingTabIndex = (items: HTMLElement[], activeIndex: number = 0) => {
    useEffect(() => {
        items.forEach((item, index) => {
            if (item) {
                item.tabIndex = index === activeIndex ? 0 : -1;
            }
        });
    }, [items, activeIndex]);

    const setActiveIndex = useCallback((newIndex: number) => {
        items.forEach((item, index) => {
            if (item) {
                item.tabIndex = index === newIndex ? 0 : -1;
                if (index === newIndex) {
                    item.focus();
                }
            }
        });
    }, [items]);

    return { setActiveIndex };
};

// Hook for announcing dynamic content changes to screen readers
export const useScreenReaderAnnouncement = () => {
    const announcementRef = useRef<HTMLDivElement>(null);

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!announcementRef.current) {
            // Create announcement element if it doesn't exist
            const element = document.createElement('div');
            element.setAttribute('aria-live', priority);
            element.setAttribute('aria-atomic', 'true');
            element.className = 'sr-only';
            element.style.position = 'absolute';
            element.style.left = '-10000px';
            element.style.width = '1px';
            element.style.height = '1px';
            element.style.overflow = 'hidden';

            document.body.appendChild(element);
            announcementRef.current = element;
        }

        // Update the message
        announcementRef.current.setAttribute('aria-live', priority);
        announcementRef.current.textContent = message;

        // Clear the message after a short delay to allow for re-announcement
        setTimeout(() => {
            if (announcementRef.current) {
                announcementRef.current.textContent = '';
            }
        }, 1000);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (announcementRef.current && announcementRef.current.parentNode) {
                announcementRef.current.parentNode.removeChild(announcementRef.current);
            }
        };
    }, []);

    return { announce };
};

// Hook for managing focus on route changes
export const useRouteFocusManagement = (pathname: string) => {
    useEffect(() => {
        // Focus the main content area when route changes
        const mainContent = document.getElementById('main-content') ||
            document.querySelector('main') ||
            document.querySelector('[role="main"]');

        if (mainContent) {
            // Set tabindex to make it focusable
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();

            // Remove tabindex after focus to restore normal tab flow
            setTimeout(() => {
                mainContent.removeAttribute('tabindex');
            }, 100);
        }
    }, [pathname]);
};