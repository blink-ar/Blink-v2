import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the animation hooks before importing the component
vi.mock("../../../hooks/useAnimation", () => ({
  useReducedMotion: vi.fn(() => false),
  useAnimatedVisibility: vi.fn(() => ({
    shouldRender: true,
    animationClass: "animate-fade-in",
  })),
  useInViewAnimation: vi.fn(() => ({
    elementRef: { current: null },
    isInView: true,
  })),
}));

import AnimatedContainer from "../AnimatedContainer";

describe("AnimatedContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when visible", () => {
    render(
      <AnimatedContainer>
        <div>Test content</div>
      </AnimatedContainer>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should apply correct animation class", () => {
    const { container } = render(
      <AnimatedContainer animation="fade">
        <div>Test content</div>
      </AnimatedContainer>
    );

    const animatedElement = container.firstChild as HTMLElement;
    expect(animatedElement).toHaveClass("animate-fade-in");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <AnimatedContainer className="custom-class">
        <div>Test content</div>
      </AnimatedContainer>
    );

    const animatedElement = container.firstChild as HTMLElement;
    expect(animatedElement).toHaveClass("custom-class");
  });

  it("should apply animation delay when provided", () => {
    const { container } = render(
      <AnimatedContainer delay={200}>
        <div>Test content</div>
      </AnimatedContainer>
    );

    const animatedElement = container.firstChild as HTMLElement;
    expect(animatedElement.style.animationDelay).toBe("200ms");
  });

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(
      <AnimatedContainer ref={ref}>
        <div>Test content</div>
      </AnimatedContainer>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
