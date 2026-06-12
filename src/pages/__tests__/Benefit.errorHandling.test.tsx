import { render, screen, waitFor } from "@testing-library/react";
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
  description: "Test Description",
  image: "https://example.com/test.jpg",
  category: "gastronomia",
  rating: 5,
  location: [
    {
      lat: -34.6,
      lng: -58.38,
      formattedAddress: "Test Street 123, CABA",
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
      cardName: "Visa",
      benefit: "10% OFF",
      rewardRate: "10%",
      color: "#000000",
      icon: "credit_card",
    },
  ],
  ...overrides,
});

describe("Benefit detail page error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.useLocation.mockReturnValue({ state: null });
    routerMocks.useParams.mockReturnValue({ id: "test-business", benefitIndex: "0" });
  });

  it("falls back to search lookup when exact merchant lookup misses", async () => {
    const legacyBusiness = makeBusiness({ id: "legacy-business", name: "Legacy Business" });
    vi.mocked(fetchBusinessById).mockResolvedValue(null);
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: true,
      businesses: [legacyBusiness],
      pagination: { total: 1, limit: 1, offset: 0, hasMore: false },
      filters: { search: "test business" },
    });

    render(<BenefitDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessesPaginated).toHaveBeenCalledWith({
        search: "test business",
        limit: 1,
        includeExpired: true,
      });
    });
    expect(await screen.findByText("Legacy Business")).toBeInTheDocument();
  });

  it("shows an error when both direct and fallback lookups fail", async () => {
    vi.mocked(fetchBusinessById).mockRejectedValue(new Error("direct failed"));
    vi.mocked(fetchBusinessesPaginated).mockRejectedValue(new Error("search failed"));

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Error al cargar")).toBeInTheDocument();
  });

  it("shows not found when no business matches the route", async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(null);
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: true,
      businesses: [],
      pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      filters: { search: "test business" },
    });

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Beneficio no encontrado")).toBeInTheDocument();
  });

  it("shows not found when a business has no benefits", async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(makeBusiness({ benefits: [] }));
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: false,
      businesses: [],
      pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      filters: {},
    });

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Beneficio no encontrado")).toBeInTheDocument();
  });

  it("falls back to the first benefit when the route index is outside the available range", async () => {
    routerMocks.useParams.mockReturnValue({ id: "test-business", benefitIndex: "99" });
    vi.mocked(fetchBusinessById).mockResolvedValue(makeBusiness());
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: false,
      businesses: [],
      pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
      filters: {},
    });

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Banco Test · Visa")).toBeInTheDocument();
    expect(screen.getByText("10% OFF")).toBeInTheDocument();
  });

  it("shows not found when a stable benefit id is not present", async () => {
    routerMocks.useParams.mockReturnValue({ id: "test-business", benefitIndex: "missing-benefit" });
    vi.mocked(fetchBusinessById).mockResolvedValue(makeBusiness({
      benefits: [
        {
          id: "benefit-1",
          bankName: "Banco Test",
          cardName: "Visa",
          benefit: "10% OFF",
          rewardRate: "10%",
          color: "#000000",
          icon: "credit_card",
        },
      ],
    }));

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Beneficio no encontrado")).toBeInTheDocument();
  });

  it("shows not found when the route is missing an id", async () => {
    routerMocks.useParams.mockReturnValue({ id: undefined, benefitIndex: undefined });

    render(<BenefitDetailPage />);

    expect(await screen.findByText("Beneficio no encontrado")).toBeInTheDocument();
    expect(fetchBusinessById).not.toHaveBeenCalled();
    expect(fetchBusinessesPaginated).not.toHaveBeenCalled();
  });
});
