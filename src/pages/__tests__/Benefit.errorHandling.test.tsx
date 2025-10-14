import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Benefit from "../Benefit";
import * as api from "../../services/api";
import { Business, BankBenefit } from "../../types";

// Mock the API
vi.mock("../../services/api");
const mockFetchBusinesses = vi.mocked(api.fetchBusinesses);

// Mock the Logger
vi.mock("../../services/base/Logger", () => ({
  Logger: {
    getInstance: () => ({
      createServiceLogger: () => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      }),
    }),
  },
}));

// Mock react-router-dom params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-business", benefitIndex: "0" }),
    useNavigate: () => vi.fn(),
  };
});

describe("Benefit Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle malformed benefit data gracefully", async () => {
    // Create a business with malformed benefit data
    const malformedBenefit: BankBenefit = {
      bankName: "Test Bank",
      cardName: "Test Card",
      benefit: "Test Benefit",
      rewardRate: "5%",
      color: "#000000",
      icon: "test-icon",
      // Add malformed data that could cause errors
      requisitos: [
        "Valid requirement",
        null as any,
        undefined as any,
        123 as any,
        {} as any,
        "Another valid requirement",
      ],
      usos: ["Valid usage", null as any, "Another valid usage"],
      cuando: "Valid date range",
      valor: "10%",
      tope: "$1000",
      condicion: "Valid condition",
      textoAplicacion: "Valid application text",
      tipo: "Valid type",
      claseDeBeneficio: "Valid class",
    };

    const mockBusiness: Business = {
      id: "test-business",
      name: "Test Business",
      description: "Test Description",
      image: "test-image.jpg",
      category: "test-category",
      benefits: [malformedBenefit],
    };

    mockFetchBusinesses.mockResolvedValue([mockBusiness]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for the component to load
    await screen.findByText("Test Bank Test Card");

    // Verify that the component renders without crashing
    expect(screen.getByText("Test Bank Test Card")).toBeInTheDocument();
    expect(screen.getByText("Test Benefit")).toBeInTheDocument();

    // Verify that valid requirements are displayed
    expect(screen.getByText("Valid requirement")).toBeInTheDocument();
    expect(screen.getByText("Another valid requirement")).toBeInTheDocument();

    // Verify that valid usage types are displayed
    expect(screen.getByText("Valid Usage")).toBeInTheDocument();
    expect(screen.getByText("Another Valid Usage")).toBeInTheDocument();

    // Verify that other sections are displayed
    expect(screen.getByText("Valid date range")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.getByText("Valid condition")).toBeInTheDocument();
    expect(screen.getByText("Valid application text")).toBeInTheDocument();
  });

  it("should handle completely malformed benefit object gracefully", async () => {
    // Create a business with a completely malformed benefit
    const malformedBenefit = {
      // Missing required fields
      bankName: null,
      cardName: undefined,
      benefit: 123,
      rewardRate: {},
      color: [],
      icon: null,
      // Malformed optional fields
      requisitos: "not an array",
      usos: null,
      cuando: 123,
      valor: {},
      tope: [],
      condicion: null,
      textoAplicacion: undefined,
      tipo: 123,
      claseDeBeneficio: {},
    } as any;

    const mockBusiness: Business = {
      id: "test-business",
      name: "Test Business",
      description: "Test Description",
      image: "test-image.jpg",
      category: "test-category",
      benefits: [malformedBenefit],
    };

    mockFetchBusinesses.mockResolvedValue([mockBusiness]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for the component to load
    await screen.findByText("Unknown Bank Unknown Card");

    // Verify that the component renders without crashing
    expect(screen.getByText("Unknown Bank Unknown Card")).toBeInTheDocument();
    expect(
      screen.getByText("Benefit description not available")
    ).toBeInTheDocument();

    // Verify that fallback content is displayed
    expect(screen.getByText("Rate not available")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    // Mock API to throw an error
    mockFetchBusinesses.mockRejectedValue(new Error("API Error"));

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for error message to appear
    await screen.findByText("Failed to load business");

    // Verify that error message is displayed
    expect(screen.getByText("Failed to load business")).toBeInTheDocument();
  });

  it("should handle missing business gracefully", async () => {
    // Mock API to return empty array
    mockFetchBusinesses.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for error message to appear
    await screen.findByText("Benefit not found");

    // Verify that error message is displayed
    expect(screen.getByText("Benefit not found")).toBeInTheDocument();
  });

  it("should handle missing benefit index gracefully", async () => {
    const mockBusiness: Business = {
      id: "test-business",
      name: "Test Business",
      description: "Test Description",
      image: "test-image.jpg",
      category: "test-category",
      benefits: [], // Empty benefits array
    };

    mockFetchBusinesses.mockResolvedValue([mockBusiness]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for error message to appear
    await screen.findByText("Benefit not found");

    // Verify that error message is displayed
    expect(screen.getByText("Benefit not found")).toBeInTheDocument();
  });
});
