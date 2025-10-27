import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import BusinessCard from "../BusinessCard";
import { Business } from "../../types";

// Mock the BankLogos module
vi.mock("../BankLogos", () => ({
  BBVALogo: ({ size, className }: { size?: number; className?: string }) => (
    <div
      data-testid="bbva-logo"
      style={{ width: size, height: size }}
      className={className}
    >
      BBVA
    </div>
  ),
  SantanderLogo: ({
    size,
    className,
  }: {
    size?: number;
    className?: string;
  }) => (
    <div
      data-testid="santander-logo"
      style={{ width: size, height: size }}
      className={className}
    >
      Santander
    </div>
  ),
  GaliciaLogo: ({ size, className }: { size?: number; className?: string }) => (
    <div
      data-testid="galicia-logo"
      style={{ width: size, height: size }}
      className={className}
    >
      Galicia
    </div>
  ),
  NacionLogo: ({ size, className }: { size?: number; className?: string }) => (
    <div
      data-testid="nacion-logo"
      style={{ width: size, height: size }}
      className={className}
    >
      Nacion
    </div>
  ),
}));

const mockBusiness: Business = {
  id: "test-business-1",
  name: "Test Restaurant",
  category: "gastronomia",
  rating: 4.5,
  image: "test-image.jpg",
  location: [
    {
      name: "Test Location",
      formattedAddress: "123 Test Street, Test City",
      addressComponents: {
        neighborhood: "Test Neighborhood",
        sublocality: "Test Sublocality",
        locality: "Test City",
      },
    },
  ],
  benefits: [
    {
      id: "benefit-1",
      title: "Test Benefit",
      description: "Test description",
      rewardRate: "20%",
      bankName: "BBVA",
      category: "gastronomia",
      validUntil: "2024-12-31",
      terms: "Test terms",
    },
  ],
};

describe("BusinessCard", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders business information correctly", () => {
    render(<BusinessCard business={mockBusiness} onClick={mockOnClick} />);

    expect(screen.getByText("Test Restaurant")).toBeInTheDocument();
    expect(screen.getByText("123 Test Street")).toBeInTheDocument();
    expect(screen.getByText("hasta 20% OFF")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<BusinessCard business={mockBusiness} onClick={mockOnClick} />);

    const card = screen.getByLabelText("Ver ofertas de Test Restaurant");
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith("test-business-1");
  });

  it("displays correct category icon", () => {
    render(<BusinessCard business={mockBusiness} onClick={mockOnClick} />);

    expect(screen.getByText("🍽️")).toBeInTheDocument();
  });

  it("shows payment method logos", () => {
    render(<BusinessCard business={mockBusiness} onClick={mockOnClick} />);

    expect(screen.getByTestId("bbva-logo")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <BusinessCard
        business={mockBusiness}
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const card = screen.getByLabelText("Ver ofertas de Test Restaurant");
    expect(card).toHaveClass("custom-class");
  });
});
