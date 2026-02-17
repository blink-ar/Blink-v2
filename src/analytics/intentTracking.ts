import { trackEvent } from './googleAnalytics';

// Maintenance note:
// If event names/params change here, update /Users/tomas/Dev/Blink/Blink-v2/ANALYTICS_EVENTS.md.
interface BaseIntentParams {
  source: string;
}

interface SearchIntentParams extends BaseIntentParams {
  searchTerm?: string;
  resultsCount: number;
  hasFilters: boolean;
  activeFilterCount?: number;
  category?: string;
}

interface FilterApplyParams extends BaseIntentParams {
  filterType: string;
  filterValue: string | number | boolean | undefined;
  activeFilterCount: number;
}

interface MapInteractionParams extends BaseIntentParams {
  action: string;
  zoomLevel?: number;
  businessId?: string;
}

interface SelectBusinessParams extends BaseIntentParams {
  businessId: string;
  category?: string;
  position?: number;
}

interface ViewBenefitParams extends BaseIntentParams {
  benefitId: string;
  businessId: string;
  category?: string;
  position?: number;
}

interface StartNavigationParams extends BaseIntentParams {
  destinationBusinessId: string;
  provider: string;
}

interface ShareBenefitParams extends BaseIntentParams {
  benefitId: string;
  businessId: string;
  channel: string;
}

interface SaveBenefitParams extends BaseIntentParams {
  benefitId: string;
  businessId: string;
}

interface NoResultsParams extends BaseIntentParams {
  searchTerm?: string;
  activeFilterCount: number;
  category?: string;
}

const normalizeText = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeFilterValue = (value: string | number | boolean | undefined): string | number | boolean | undefined => {
  if (value === undefined) return 'none';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || 'none';
  }
  return value;
};

export function trackSearchIntent(params: SearchIntentParams): void {
  trackEvent('search', {
    source: params.source,
    search_term: normalizeText(params.searchTerm),
    results_count: params.resultsCount,
    has_filters: params.hasFilters,
    active_filter_count: params.activeFilterCount,
    category: normalizeText(params.category),
  });
}

export function trackFilterApply(params: FilterApplyParams): void {
  trackEvent('filter_apply', {
    source: params.source,
    filter_type: params.filterType,
    filter_value: normalizeFilterValue(params.filterValue),
    active_filter_count: params.activeFilterCount,
  });
}

export function trackMapInteraction(params: MapInteractionParams): void {
  trackEvent('map_interaction', {
    source: params.source,
    action: params.action,
    zoom_level: params.zoomLevel,
    business_id: params.businessId,
  });
}

export function trackSelectBusiness(params: SelectBusinessParams): void {
  trackEvent('select_business', {
    source: params.source,
    business_id: params.businessId,
    category: normalizeText(params.category),
    position: params.position,
  });
}

export function trackViewBenefit(params: ViewBenefitParams): void {
  trackEvent('view_benefit', {
    source: params.source,
    benefit_id: params.benefitId,
    business_id: params.businessId,
    category: normalizeText(params.category),
    position: params.position,
  });
}

export function trackStartNavigation(params: StartNavigationParams): void {
  trackEvent('start_navigation', {
    source: params.source,
    destination_business_id: params.destinationBusinessId,
    provider: params.provider,
  });
}

export function trackShareBenefit(params: ShareBenefitParams): void {
  trackEvent('share_benefit', {
    source: params.source,
    benefit_id: params.benefitId,
    business_id: params.businessId,
    channel: params.channel,
  });
}

export function trackSaveBenefit(params: SaveBenefitParams): void {
  trackEvent('save_benefit', {
    source: params.source,
    benefit_id: params.benefitId,
    business_id: params.businessId,
  });
}

export function trackUnsaveBenefit(params: SaveBenefitParams): void {
  trackEvent('unsave_benefit', {
    source: params.source,
    benefit_id: params.benefitId,
    business_id: params.businessId,
  });
}

export function trackNoResults(params: NoResultsParams): void {
  trackEvent('no_results', {
    source: params.source,
    search_term: normalizeText(params.searchTerm),
    active_filter_count: params.activeFilterCount,
    category: normalizeText(params.category),
  });
}
