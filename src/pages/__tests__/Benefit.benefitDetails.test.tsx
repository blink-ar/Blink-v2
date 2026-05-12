import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BenefitDetailPage from "../BenefitDetailPage";
import { Business } from "../../types";
import { fetchBusinessById, fetchBusinessesPaginated } from "../../services/api";

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useLocation: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  fetchBusinessById: vi.fn(),
  fetchBusinessesPaginated: vi.fn(),
}));

vi.mock("../../analytics/intentTracking", () => ({
  trackSaveBenefit: vi.fn(),
  trackShareBenefit: vi.fn(),
  trackStartNavigation: vi.fn(),
  trackUnsaveBenefit: vi.fn(),
  trackViewBenefit: vi.fn(),
}));

vi.mock("../../hooks/useSEO", () => ({
  useSEO: vi.fn(),
}));

vi.mock("../../hooks/useGeolocation", () => ({
  useGeolocation: () => ({ position: null, error: null, isLoading: false }),
}));

vi.mock("../../hooks/useSubscriptions", () => ({
  useSubscriptions: () => ({
    subscriptions: [],
    isLoading: false,
    error: null,
    getSubscriptionById: vi.fn(() => null),
    getSubscriptionName: vi.fn(() => null),
    getSubscriptionsByBank: vi.fn(() => []),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: routerMocks.useParams,
    useNavigate: () => routerMocks.navigate,
    useLocation: routerMocks.useLocation,
  };
});

const makeBusiness = (overrides: Partial<Business> = {}): Business => ({
  id: "test-business",
  name: "Test Business",
  category: "gastronomia",
  description: "Test business description",
  rating: 4.5,
  image: "https://example.com/test-business.jpg",
  location: [
    {
      lat: -34.6,
      lng: -58.38,
      formattedAddress: "Test Street 123, CABA",
      addressComponents: {
        route: "Test Street",
        streetNumber: "123",
        locality: "CABA",
        country: "Argentina",
      },
      source: "address",
      provider: "google",
      confidence: 1,
      raw: "Test Street 123, CABA",
      updatedAt: "2026-05-01T00:00:00.000Z",
    },
  ],
  benefits: [
    {
      bankName: "Banco Test",
      cardName: "Visa Gold",
      cardTypes: ["Visa Gold", "Mastercard Black"],
      benefit: "25% reintegro",
      rewardRate: "25%",
      color: "#000000",
      icon: "credit_card",
      description: "Descuento especial en el comercio",
      tipo: "crédito",
      cuando: "lunes, martes",
      tope: "$100.000",
      condicion: "Compra mínima de $50.000",
      requisitos: ["DNI vigente", "Cuenta activa"],
      usos: ["online", "presencial"],
      textoAplicacion: "Se acredita automáticamente en el resumen",
      validUntil: "2026-12-31",
    },
  ],
  ...overrides,
});

describe("Benefit detail page content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.useLocation.mockReturnValue({ state: null });
    routerMocks.useParams.mockReturnValue({ id: "test-business", benefitIndex: "0" });
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: false,
      businesses: [],
      pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      filters: {},
    });
  });

  it("renders the current benefit details from a direct merchant lookup", async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(makeBusiness());

    render(<BenefitDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessById).toHaveBeenCalledWith("test-business");
    });

    expect(await screen.findByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Banco Test · Visa Gold")).toBeInTheDocument();
    expect(screen.getByText("25% reintegro")).toBeInTheDocument();
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByText("de ahorro")).toBeInTheDocument();
    expect(screen.getByText("Condiciones")).toBeInTheDocument();
    expect(screen.getByText("Tope descuento")).toBeInTheDocument();
    expect(screen.getByText("$100.000")).toBeInTheDocument();
    expect(screen.getByText("Vigencia")).toBeInTheDocument();
    expect(screen.getByText("hasta 31/12/2026")).toBeInTheDocument();
    expect(screen.getByText("Pagando con")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta de Crédito")).toBeInTheDocument();
    expect(screen.getByText("Accede al beneficio")).toBeInTheDocument();
    expect(screen.getByText("Con tus tarjetas de Banco Test:")).toBeInTheDocument();
    expect(screen.getByText("Visa Gold")).toBeInTheDocument();
    expect(screen.getByText("Mastercard Black")).toBeInTheDocument();
    expect(screen.getByText("Disponible en:")).toBeInTheDocument();
    expect(screen.getByText("Test Street 123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /términos y condiciones/i }));

    expect(screen.getByText(/Compra mínima de \$50\.000/)).toBeInTheDocument();
    expect(screen.getByText(/DNI vigente/)).toBeInTheDocument();
    expect(screen.getByText(/Cuenta activa/)).toBeInTheDocument();
    expect(screen.getByText(/Se acredita automáticamente/)).toBeInTheDocument();
  });

  it("omits optional detail sections when the benefit has no optional terms or valid locations", async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(
      makeBusiness({
        location: [
          {
            lat: 0,
            lng: 0,
            formattedAddress: "Multiple locations",
            source: "address",
            provider: "google",
            confidence: 0.5,
            raw: "Multiple locations",
            updatedAt: "2026-05-01T00:00:00.000Z",
          },
        ],
        benefits: [
          {
            bankName: "Banco Test",
            cardName: "Visa",
            benefit: "Beneficio exclusivo",
            rewardRate: "N/A",
            color: "#000000",
            icon: "credit_card",
          },
        ],
      })
    );

    render(<BenefitDetailPage />);

    expect(await screen.findAllByText("Beneficio exclusivo")).toHaveLength(2);
    expect(screen.queryByText("Tope descuento")).not.toBeInTheDocument();
    expect(screen.queryByText("Disponible en:")).not.toBeInTheDocument();
    expect(screen.queryByText("Términos y condiciones")).not.toBeInTheDocument();
  });
});
