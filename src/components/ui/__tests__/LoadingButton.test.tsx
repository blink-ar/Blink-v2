import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the animation hooks
vi.mock("../../../hooks/useAnimation", () => ({
  useLoadingAnimation: vi.fn(() => ({
    animationState: "idle",
    getLoadingClass: vi.fn(() => ""),
  })),
  useReducedMotion: vi.fn(() => false),
}));

import LoadingButton from "../LoadingButton";

describe("LoadingButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when not loading", () => {
    render(<LoadingButton>Click me</LoadingButton>);

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should show loading state when isLoading is true", () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Click me")).not.toBeInTheDocument();
  });

  it("should show custom loading text", () => {
    render(
      <LoadingButton isLoading={true} loadingText="Processing...">
        Click me
      </LoadingButton>
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("should be disabled when loading", () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should call onClick when clicked and not loading", () => {
    const handleClick = vi.fn();

    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when loading", () => {
    const handleClick = vi.fn();

    render(
      <LoadingButton isLoading={true} onClick={handleClick}>
        Click me
      </LoadingButton>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply correct variant classes", () => {
    const { rerender } = render(
      <LoadingButton variant="primary">Click me</LoadingButton>
    );

    let button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-600");

    rerender(<LoadingButton variant="success">Click me</LoadingButton>);

    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-green-600");
  });

  it("should apply full width when specified", () => {
    render(<LoadingButton fullWidth>Click me</LoadingButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-full");
  });

  it("should apply custom className", () => {
    render(<LoadingButton className="custom-class">Click me</LoadingButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
