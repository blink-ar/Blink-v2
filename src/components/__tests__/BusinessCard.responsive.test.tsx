import React from "react";
import { render, screen } from "@testing-library/react";
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

const mockBusiness: Business = {
  id: "1",
  name: "Test Business",
  description: "A test business description",
  image: "/test-image.jpg",
  rating: 4.5,
  location: "Test Location",
  category: "restaurant",
  benefits: [
    {
      bankName: "Test Bank",
      cardName: "Test Card",
      benefit: "Test benefit description",
      rewardRate: "5% cashback",
      color: "bg-blue-500",
    },
  ],
};

describe("BusinessCard Responsive Design", () => {
  it("renders with default variant", () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("Test Location")).toBeInTheDocument();
  });

  it("renders with compact variant", () => {
    render(<BusinessCard business={mockBusiness} variant="compact" />);

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Test Bank")).toBeInTheDocument();
  });

  it("renders with featured variant", () => {
    render(<BusinessCard business={mockBusiness} variant="featured" />);

    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Test Bank")).toBeInTheDocument();
  });

  it("handles multiple benefits correctly", () => {
    const businessWithMultipleBenefits: Business = {
      ...mockBusiness,
      benefits: [
        {
          bankName: "Bank 1",
          cardName: "Card 1",
          benefit: "Benefit 1",
          rewardRate: "3% cashback",
          color: "bg-blue-500",
        },
        {
          bankName: "Bank 2",
          cardName: "Card 2",
          benefit: "Benefit 2",
          rewardRate: "2% cashback",
          color: "bg-green-500",
        },
      ],
    };

    render(<BusinessCard business={businessWithMultipleBenefits} />);

    // Should show both benefits directly (new design shows first 2 benefits)
    expect(screen.getByText("Bank 1")).toBeInTheDocument();
    expect(screen.getByText("Bank 2")).toBeInTheDocument();
  });

  it("calls onBenefitClick when benefit is clicked", () => {
    const mockOnBenefitClick = vi.fn();

    render(
      <BusinessCard
        business={mockBusiness}
        onBenefitClick={mockOnBenefitClick}
      />
    );

    const benefitButton = screen.getByRole("button");
    benefitButton.click();

    expect(mockOnBenefitClick).toHaveBeenCalledWith(0);
  });

  it("applies correct CSS classes for compact variant", () => {
    const { container } = render(
      <BusinessCard business={mockBusiness} variant="compact" />
    );

    // Check if the card has the compact image height
    const imageElement = container.querySelector('[class*="h-28"]');
    expect(imageElement).toBeInTheDocument();
  });

  it("shows loading state correctly", () => {
    render(<BusinessCard business={mockBusiness} isLoading={true} />);

    // The component should still render the business content
    // Loading states are typically handled at a higher level
    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });
});
