import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { TouchButton } from "../TouchButton";

describe("TouchButton", () => {
  it("renders with correct minimum height for touch targets", () => {
    render(<TouchButton>Test Button</TouchButton>);
    const button = screen.getByRole("button");

    // Check that button has minimum touch target size
    expect(button).toHaveClass("min-h-[44px]");
  });

  it("applies touch optimization classes by default", () => {
    render(<TouchButton>Test Button</TouchButton>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("touch-manipulation");
    expect(button).toHaveClass("select-none");
  });

  it("can disable touch optimizations", () => {
    render(<TouchButton touchOptimized={false}>Test Button</TouchButton>);
    const button = screen.getByRole("button");

    expect(button).not.toHaveClass("touch-manipulation");
    expect(button).not.toHaveClass("select-none");
  });

  it("shows loading state correctly", () => {
    render(<TouchButton isLoading>Test Button</TouchButton>);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<TouchButton onClick={handleClick}>Test Button</TouchButton>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<TouchButton size="sm">Small</TouchButton>);
    expect(screen.getByRole("button")).toHaveClass("min-h-[36px]");

    rerender(<TouchButton size="md">Medium</TouchButton>);
    expect(screen.getByRole("button")).toHaveClass("min-h-[44px]");

    rerender(<TouchButton size="lg">Large</TouchButton>);
    expect(screen.getByRole("button")).toHaveClass("min-h-[48px]");
  });

  it("applies full width when specified", () => {
    render(<TouchButton fullWidth>Full Width</TouchButton>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });
});
