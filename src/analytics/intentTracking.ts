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

const toSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const normalizeEnum = (value: string): string => {
  const normalized = toSlug(value);
  return normalized || 'unknown';
};

const normalizeCategory = (value: string | undefined): { token: string; raw: string } => {
  const raw = normalizeText(value) ?? 'none';
  return {
    token: raw === 'none' ? 'none' : normalizeEnum(raw),
    raw,
  };
};

const getPositionBucket = (position: number | undefined): string => {
  if (position === undefined || position <= 0) return 'unknown';
  if (position <= 3) return 'top_3';
  if (position <= 10) return 'top_10';
  return 'beyond_10';
};

const formatFilterValue = (
  filterType: string,
  rawValue: string | number | boolean | undefined,
): string => {
  const normalizedType = toSlug(filterType);
  const normalizedValue = normalizeFilterValue(rawValue);

  if (normalizedValue === 'none') {
    return `${normalizedType}_none`;
  }

  if (normalizedType === 'discount' && typeof normalizedValue === 'number') {
    return `discount_${normalizedValue}_percent_plus`;
  }

  if (normalizedType === 'distance' && typeof normalizedValue === 'number') {
    return `distance_within_${normalizedValue}_km`;
  }

  if (normalizedType === 'installments' && typeof normalizedValue === 'boolean') {
    return normalizedValue ? 'installments_enabled' : 'installments_disabled';
  }

  if (normalizedType === 'online' && typeof normalizedValue === 'boolean') {
    return normalizedValue ? 'online_only_enabled' : 'online_only_disabled';
  }

  if (typeof normalizedValue === 'boolean') {
    return `${normalizedType}_${normalizedValue ? 'enabled' : 'disabled'}`;
  }

  if (typeof normalizedValue === 'number') {
    return `${normalizedType}_${normalizedValue}`;
  }

  return `${normalizedType}_${toSlug(normalizedValue)}`;
};

export function trackSearchIntent(params: SearchIntentParams): void {
  const category = normalizeCategory(params.category);

  trackEvent('search', {
    source: normalizeEnum(params.source),
    search_term: normalizeText(params.searchTerm),
    search_term_state: normalizeText(params.searchTerm) ? 'provided' : 'empty',
    results_count: params.resultsCount,
    has_filters: params.hasFilters,
    has_filters_state: params.hasFilters ? 'filters_applied' : 'no_filters',
    active_filter_count: params.activeFilterCount,
    category: category.token,
    category_raw: category.raw,
  });
}

export function trackFilterApply(params: FilterApplyParams): void {
  const rawValue = normalizeFilterValue(params.filterValue);

  trackEvent('filter_apply', {
    source: normalizeEnum(params.source),
    filter_type: normalizeEnum(params.filterType),
    filter_value: formatFilterValue(params.filterType, params.filterValue),
    filter_value_raw: typeof rawValue === 'string' ? rawValue : String(rawValue),
    active_filter_count: params.activeFilterCount,
  });
}

export function trackMapInteraction(params: MapInteractionParams): void {
  trackEvent('map_interaction', {
    source: normalizeEnum(params.source),
    action: normalizeEnum(params.action),
    zoom_level: params.zoomLevel,
    business_id: params.businessId,
  });
}

export function trackSelectBusiness(params: SelectBusinessParams): void {
  const category = normalizeCategory(params.category);

  trackEvent('select_business', {
    source: normalizeEnum(params.source),
    business_id: params.businessId,
    category: category.token,
    category_raw: category.raw,
    position: params.position,
    position_bucket: getPositionBucket(params.position),
  });
}

export function trackViewBenefit(params: ViewBenefitParams): void {
  const category = normalizeCategory(params.category);

  trackEvent('view_benefit', {
    source: normalizeEnum(params.source),
    benefit_id: params.benefitId,
    business_id: params.businessId,
    category: category.token,
    category_raw: category.raw,
    position: params.position,
    position_bucket: getPositionBucket(params.position),
  });
}

export function trackStartNavigation(params: StartNavigationParams): void {
  trackEvent('start_navigation', {
    source: normalizeEnum(params.source),
    destination_business_id: params.destinationBusinessId,
    provider: normalizeEnum(params.provider),
  });
}

export function trackShareBenefit(params: ShareBenefitParams): void {
  trackEvent('share_benefit', {
    source: normalizeEnum(params.source),
    benefit_id: params.benefitId,
    business_id: params.businessId,
    channel: normalizeEnum(params.channel),
  });
}

export function trackSaveBenefit(params: SaveBenefitParams): void {
  trackEvent('save_benefit', {
    source: normalizeEnum(params.source),
    benefit_id: params.benefitId,
    business_id: params.businessId,
  });
}

export function trackUnsaveBenefit(params: SaveBenefitParams): void {
  trackEvent('unsave_benefit', {
    source: normalizeEnum(params.source),
    benefit_id: params.benefitId,
    business_id: params.businessId,
  });
}

export function trackNoResults(params: NoResultsParams): void {
  const category = normalizeCategory(params.category);

  trackEvent('no_results', {
    source: normalizeEnum(params.source),
    search_term: normalizeText(params.searchTerm),
    search_term_state: normalizeText(params.searchTerm) ? 'provided' : 'empty',
    active_filter_count: params.activeFilterCount,
    has_filters_state: params.activeFilterCount > 0 ? 'filters_applied' : 'no_filters',
    category: category.token,
    category_raw: category.raw,
  });
}
