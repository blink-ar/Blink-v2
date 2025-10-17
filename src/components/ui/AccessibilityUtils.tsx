import React, { useEffect, useRef } from "react";

// Skip to content link for keyboard navigation
export const SkipToContent: React.FC<{ targetId: string }> = ({ targetId }) => {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg"
      style={{
        position: "absolute",
        top: "-40px",
        left: "6px",
        background: "var(--color-primary-500)",
        color: "var(--color-white)",
        padding: "8px 16px",
        textDecoration: "none",
        borderRadius: "var(--radius-sm)",
        zIndex: "var(--z-modal)",
        transition: "top var(--transition-fast)",
      }}
      onFocus={(e) => {
        (e.target as HTMLElement).style.top = "6px";
      }}
      onBlur={(e) => {
        (e.target as HTMLElement).style.top = "-40px";
      }}
    >
      Saltar al contenido principal
    </a>
  );
};

// Screen reader only text
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <span className="sr-only">{children}</span>;
};

// Live region for dynamic content announcements
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
}> = ({ children, politeness = "polite", atomic = false }) => {
  return (
    <div aria-live={politeness} aria-atomic={atomic} className="sr-only">
      {children}
    </div>
  );
};

// Focus trap for modals and dialogs
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active: boolean;
  onEscape?: () => void;
}> = ({ children, active, onEscape }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    firstFocusableRef.current = focusableElements[0] as HTMLElement;
    lastFocusableRef.current = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // Focus first element
    firstFocusableRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onEscape]);

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  );
};

// Keyboard navigation helper
export const useKeyboardNavigation = (
  items: HTMLElement[],
  orientation: "horizontal" | "vertical" = "vertical"
) => {
  const currentIndex = useRef(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    const { key } = e;
    const isHorizontal = orientation === "horizontal";

    let nextIndex = currentIndex.current;

    switch (key) {
      case isHorizontal ? "ArrowLeft" : "ArrowUp":
        e.preventDefault();
        nextIndex =
          currentIndex.current > 0
            ? currentIndex.current - 1
            : items.length - 1;
        break;
      case isHorizontal ? "ArrowRight" : "ArrowDown":
        e.preventDefault();
        nextIndex =
          currentIndex.current < items.length - 1
            ? currentIndex.current + 1
            : 0;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    currentIndex.current = nextIndex;
    items[nextIndex]?.focus();
  };

  return { handleKeyDown };
};

// Accessible button with proper ARIA attributes
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  describedBy?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}> = ({
  children,
  onClick,
  disabled = false,
  pressed,
  expanded,
  controls,
  describedBy,
  className = "",
  variant = "primary",
}) => {
  const baseClasses = "touch-target touch-button focus-visible:focus-visible";
  const variantClasses = {
    primary: "bg-primary-500 text-white hover:bg-primary-600",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        minWidth: "var(--touch-target-min)",
        minHeight: "var(--touch-target-min)",
      }}
    >
      {children}
    </button>
  );
};

// Accessible form field with proper labeling
export const AccessibleFormField: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  className = "",
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`form-field ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="requerido">
            *
          </span>
        )}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        style={{
          minHeight: "var(--touch-target-min)",
          fontSize: "16px", // Prevents zoom on iOS
        }}
      />

      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-600">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Loading announcement for screen readers
export const LoadingAnnouncement: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = "Cargando contenido" }) => {
  return (
    <LiveRegion politeness="polite">{isLoading ? message : ""}</LiveRegion>
  );
};

// Error announcement for screen readers
export const ErrorAnnouncement: React.FC<{ error: string | null }> = ({
  error,
}) => {
  return (
    <LiveRegion politeness="assertive">
      {error ? `Error: ${error}` : ""}
    </LiveRegion>
  );
};
