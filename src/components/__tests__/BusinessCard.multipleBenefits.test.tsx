import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { BusinessCard } from "../BusinessCard";
import { Business } from "../../types";

// Mock the useResponsive hook
vi.mock("../../hooks/useResponsive", () => ({
  useResponsive: () => ({
    isDesktop: true,
    isTablet: false,
    isMobile: false,
  }),
}));

const mockBusinessWithMultipleBenefits: Business = {
  id: "1",
  name: "Test Business",
  description: "A test business description",
  image: "/test-image.jpg",
  rating: 4.5,
  location: "Test Location",
  category: "restaurant",
  benefits: [
    {
      bankName: "Bank 1",
      cardName: "Card 1",
      benefit: "Benefit 1 description",
      rewardRate: "5% cashback",
      color: "bg-blue-500",
    },
    {
      bankName: "Bank 2",
      cardName: "Card 2",
      benefit: "Benefit 2 description",
      rewardRate: "3% cashback",
      color: "bg-green-500",
    },
    {
      bankName: "Bank 3",
      cardName: "Card 3",
      benefit: "Benefit 3 description",
      rewardRate: "2% cashback",
      color: "bg-red-500",
    },
    {
      bankName: "Bank 4",
      cardName: "Card 4",
      benefit: "Benefit 4 description",
      rewardRate: "4% cashback",
      color: "bg-purple-500",
    },
  ],
};

describe("BusinessCard Multiple Benefits Design", () => {
  it("shows first 2 benefits by default", () => {
    render(<BusinessCard business={mockBusinessWithMultipleBenefits} />);

    // Should show first 2 benefits
    expect(screen.getByText("Bank 1")).toBeInTheDocument();
    expect(screen.getByText("Bank 2")).toBeInTheDocument();
    expect(screen.getByText("5% cashback")).toBeInTheDocument();
    expect(screen.getByText("3% cashback")).toBeInTheDocument();

    // Should not show the remaining benefits initially
    expect(screen.queryByText("Bank 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Bank 4")).not.toBeInTheDocument();
  });

  it("shows expand button with correct count", () => {
    render(<BusinessCard business={mockBusinessWithMultipleBenefits} />);

    // Should show "+2 más" button (4 total - 2 shown = 2 more)
    expect(screen.getByText("+2 más")).toBeInTheDocument();
  });

  it("expands to show all benefits when expand button is clicked", () => {
    render(<BusinessCard business={mockBusinessWithMultipleBenefits} />);

    const expandButton = screen.getByText("+2 más");
    fireEvent.click(expandButton);

    // Should now show all benefits
    expect(screen.getByText("Bank 1")).toBeInTheDocument();
    expect(screen.getByText("Bank 2")).toBeInTheDocument();
    expect(screen.getByText("Bank 3")).toBeInTheDocument();
    expect(screen.getByText("Bank 4")).toBeInTheDocument();

    // Button should change to "Ver menos"
    expect(screen.getByText("Ver menos")).toBeInTheDocument();
  });

  it("collapses benefits when 'Ver menos' is clicked", () => {
    render(<BusinessCard business={mockBusinessWithMultipleBenefits} />);

    // Expand first
    const expandButton = screen.getByText("+2 más");
    fireEvent.click(expandButton);

    // Then collapse
    const collapseButton = screen.getByText("Ver menos");
    fireEvent.click(collapseButton);

    // Should hide the extra benefits again
    expect(screen.queryByText("Bank 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Bank 4")).not.toBeInTheDocument();

    // Should show first 2 benefits
    expect(screen.getByText("Bank 1")).toBeInTheDocument();
    expect(screen.getByText("Bank 2")).toBeInTheDocument();
  });

  it("calls onBenefitClick with correct index for visible benefits", () => {
    const mockOnBenefitClick = vi.fn();

    render(
      <BusinessCard
        business={mockBusinessWithMultipleBenefits}
        onBenefitClick={mockOnBenefitClick}
      />
    );

    // Click on first benefit
    const firstBenefit = screen.getByText("Bank 1").closest("button");
    fireEvent.click(firstBenefit!);
    expect(mockOnBenefitClick).toHaveBeenCalledWith(0);

    // Click on second benefit
    const secondBenefit = screen.getByText("Bank 2").closest("button");
    fireEvent.click(secondBenefit!);
    expect(mockOnBenefitClick).toHaveBeenCalledWith(1);
  });

  it("calls onBenefitClick with correct index for expanded benefits", () => {
    const mockOnBenefitClick = vi.fn();

    render(
      <BusinessCard
        business={mockBusinessWithMultipleBenefits}
        onBenefitClick={mockOnBenefitClick}
      />
    );

    // Expand to show all benefits
    const expandButton = screen.getByText("+2 más");
    fireEvent.click(expandButton);

    // Click on third benefit (index 2)
    const thirdBenefit = screen.getByText("Bank 3").closest("button");
    fireEvent.click(thirdBenefit!);
    expect(mockOnBenefitClick).toHaveBeenCalledWith(2);

    // Click on fourth benefit (index 3)
    const fourthBenefit = screen.getByText("Bank 4").closest("button");
    fireEvent.click(fourthBenefit!);
    expect(mockOnBenefitClick).toHaveBeenCalledWith(3);
  });

  it("handles business with exactly 2 benefits (no expand button)", () => {
    const businessWith2Benefits: Business = {
      ...mockBusinessWithMultipleBenefits,
      benefits: mockBusinessWithMultipleBenefits.benefits.slice(0, 2),
    };

    render(<BusinessCard business={businessWith2Benefits} />);

    // Should show both benefits
    expect(screen.getByText("Bank 1")).toBeInTheDocument();
    expect(screen.getByText("Bank 2")).toBeInTheDocument();

    // Should not show expand button
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("más")).not.toBeInTheDocument();
  });

  it("applies correct styling classes for compact layout", () => {
    const { container } = render(
      <BusinessCard
        business={mockBusinessWithMultipleBenefits}
        variant="compact"
      />
    );

    // Should have compact styling classes
    const benefitButtons = container.querySelectorAll(
      '[class*="min-h-[44px]"]'
    );
    expect(benefitButtons.length).toBeGreaterThan(0);
  });
});
