import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the animation hooks to disable animations in tests
vi.mock("../../../hooks/useAnimation", () => ({
  useReducedMotion: vi.fn(() => true), // Force reduced motion for predictable tests
}));

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: vi.fn((cb) => setTimeout(cb, 16)),
});

import ProgressIndicator from "../ProgressIndicator";

describe("ProgressIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with correct progress value", () => {
    render(<ProgressIndicator value={50} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("should show percentage when enabled", () => {
    render(<ProgressIndicator value={75} showPercentage />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should show label when provided", () => {
    render(<ProgressIndicator value={50} label="Upload Progress" />);

    expect(screen.getByText("Upload Progress")).toBeInTheDocument();
  });

  it("should apply correct size classes", () => {
    const { rerender, container } = render(
      <ProgressIndicator value={50} size="sm" />
    );

    let progressContainer = container.querySelector(".h-1");
    expect(progressContainer).toBeInTheDocument();

    rerender(<ProgressIndicator value={50} size="lg" />);

    progressContainer = container.querySelector(".h-3");
    expect(progressContainer).toBeInTheDocument();
  });

  it("should apply correct variant colors", () => {
    const { rerender, container } = render(
      <ProgressIndicator value={50} variant="success" />
    );

    let progressBar = container.querySelector(".bg-green-600");
    expect(progressBar).toBeInTheDocument();

    rerender(<ProgressIndicator value={50} variant="danger" />);

    progressBar = container.querySelector(".bg-red-600");
    expect(progressBar).toBeInTheDocument();
  });

  it("should handle custom max value", () => {
    render(<ProgressIndicator value={25} max={50} showPercentage />);

    expect(screen.getByText("50%")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuemax", "50");
  });

  it("should clamp values to valid range", () => {
    const { rerender } = render(
      <ProgressIndicator value={-10} showPercentage />
    );

    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<ProgressIndicator value={150} showPercentage />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ProgressIndicator value={50} className="custom-class" />
    );

    const progressContainer = container.querySelector(".custom-class");
    expect(progressContainer).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<ProgressIndicator value={60} label="File Upload" />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-label", "File Upload");
    expect(progressBar).toHaveAttribute("aria-valuenow", "60");
  });
});
