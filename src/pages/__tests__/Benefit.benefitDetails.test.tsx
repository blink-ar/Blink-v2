import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Benefit from "../Benefit";
import { fetchBusinesses } from "../../services/api";

// Mock the API
vi.mock("../../services/api");
const mockFetchBusinesses = vi.mocked(fetchBusinesses);

// Mock useParams to return test values
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-business", benefitIndex: "0" }),
    useNavigate: () => vi.fn(),
  };
});

const mockBusinessWithBenefitDetails = {
  id: "test-business",
  name: "Test Business",
  category: "gastronomia",
  description: "Test business description",
  rating: 4.5,
  location: "Test Location",
  image: "test-image.jpg",
  benefits: [
    {
      bankName: "Test Bank",
      cardName: "Test Card",
      benefit: "Test Benefit Description",
      rewardRate: "5%",
      color: "#000000",
      icon: "test-icon",
      // Extended benefit details
      tipo: "cashback",
      cuando: "01/01/2024 - 31/12/2024",
      valor: "50000 pesos",
      tope: "$100,000",
      claseDeBeneficio: "premium rewards",
      condicion: "Minimum purchase of $50,000\nValid only on weekends",
      requisitos: [
        "Valid ID required",
        "  Minimum age 18  ",
        "", // Empty requirement should be filtered out
        "Active account for 6 months",
      ],
      usos: ["online_shopping", "in-store", "mobile_payments"],
      textoAplicacion:
        "Apply through mobile app\n\nProcessing time: 24-48 hours",
    },
  ],
};

describe("Benefit Details Processing", () => {
  beforeEach(() => {
    mockFetchBusinesses.mockResolvedValue([mockBusinessWithBenefitDetails]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should display formatted benefit details correctly", async () => {
    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for the component to load
    await screen.findByText("Test Business - Test Card");

    // Check that benefit details section is rendered
    expect(screen.getByText("Detailed Information")).toBeInTheDocument();

    // Check formatted benefit type and class (now displayed in main section)
    expect(screen.getByText("Cashback")).toBeInTheDocument();
    expect(screen.getByText("Premium Rewards")).toBeInTheDocument();

    // Check formatted validity period
    expect(screen.getByText("Validity Period")).toBeInTheDocument();

    // Check formatted value and limits
    expect(screen.getByText("Value & Limits")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument(); // Formatted value
    expect(screen.getByText("$100,000")).toBeInTheDocument(); // Formatted limit

    // Check conditions with preserved line breaks
    expect(screen.getByText("Important Conditions")).toBeInTheDocument();
    expect(
      screen.getByText(/Minimum purchase of \$50,000/)
    ).toBeInTheDocument();

    // Check processed usage types
    expect(screen.getByText("Where You Can Use This")).toBeInTheDocument();
    expect(screen.getByText("Online Shopping")).toBeInTheDocument();
    expect(screen.getByText("In Store")).toBeInTheDocument();
    expect(screen.getByText("Mobile Payments")).toBeInTheDocument();

    // Check processed requirements (empty ones should be filtered out)
    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Valid ID required")).toBeInTheDocument();
    expect(screen.getByText("Minimum age 18")).toBeInTheDocument(); // Trimmed
    expect(screen.getByText("Active account for 6 months")).toBeInTheDocument();

    // Check application text with preserved formatting
    expect(screen.getByText("How to Apply")).toBeInTheDocument();
    expect(screen.getByText(/Apply through mobile app/)).toBeInTheDocument();
    expect(
      screen.getByText(/Processing time: 24-48 hours/)
    ).toBeInTheDocument();
  });

  it("should not display sections when benefit details are empty", async () => {
    const businessWithEmptyDetails = {
      ...mockBusinessWithBenefitDetails,
      benefits: [
        {
          bankName: "Test Bank",
          cardName: "Test Card",
          benefit: "Test Benefit Description",
          rewardRate: "5%",
          color: "#000000",
          icon: "test-icon",
          // All optional fields are empty or undefined
          tipo: "",
          cuando: undefined,
          valor: "   ", // Whitespace only
          tope: null,
          claseDeBeneficio: "",
          condicion: "",
          requisitos: [],
          usos: ["", "   "], // Empty and whitespace only
          textoAplicacion: "",
        },
      ],
    };

    mockFetchBusinesses.mockResolvedValue([businessWithEmptyDetails]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for the component to load
    await screen.findByText("Test Business - Test Card");

    // Benefit Details section should not be rendered when all details are empty
    expect(screen.queryByText("Detailed Information")).not.toBeInTheDocument();
  });

  it("should handle malformed benefit data gracefully", async () => {
    const businessWithMalformedData = {
      ...mockBusinessWithBenefitDetails,
      benefits: [
        {
          bankName: "Test Bank",
          cardName: "Test Card",
          benefit: "Test Benefit Description",
          rewardRate: "5%",
          color: "#000000",
          icon: "test-icon",
          // Malformed data
          tipo: 123 as any, // Non-string type
          cuando: ["not", "a", "string"] as any, // Array instead of string
          valor: { invalid: "object" } as any, // Object instead of string
          requisitos: ["Valid requirement", null, undefined, 123] as any, // Mixed types
          usos: "not an array" as any, // String instead of array
        },
      ],
    };

    mockFetchBusinesses.mockResolvedValue([businessWithMalformedData]);

    render(
      <BrowserRouter>
        <Benefit />
      </BrowserRouter>
    );

    // Wait for the component to load
    await screen.findByText("Test Business - Test Card");

    // Component should still render without crashing
    expect(screen.getByText("Test Business - Test Card")).toBeInTheDocument();

    // Only valid requirements should be displayed
    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Valid requirement")).toBeInTheDocument();
  });
});
