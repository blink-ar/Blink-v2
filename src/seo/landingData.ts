import { Business } from '../types';

export interface LandingBank {
  slug: string;
  name: string;
  aliases: string[];
}

export interface LandingCategory {
  slug: string;
  name: string;
}

export interface LandingCity {
  slug: string;
  name: string;
  aliases: string[];
}

export interface FeaturedLandingLink {
  label: string;
  href: string;
}

export const LANDING_BANKS: LandingBank[] = [
  { slug: 'galicia', name: 'Banco Galicia', aliases: ['galicia'] },
  { slug: 'santander', name: 'Banco Santander', aliases: ['santander', 'rio'] },
  { slug: 'bbva', name: 'BBVA', aliases: ['bbva', 'frances', 'banco frances'] },
  { slug: 'macro', name: 'Banco Macro', aliases: ['macro'] },
  { slug: 'nacion', name: 'Banco Nacion', aliases: ['nacion', 'bna', 'banco nacion'] },
  { slug: 'icbc', name: 'ICBC', aliases: ['icbc'] },
];

export const LANDING_CATEGORIES: LandingCategory[] = [
  { slug: 'gastronomia', name: 'Gastronomia' },
  { slug: 'moda', name: 'Moda' },
  { slug: 'shopping', name: 'Supermercado y shopping' },
  { slug: 'hogar', name: 'Hogar' },
  { slug: 'deportes', name: 'Deportes' },
  { slug: 'belleza', name: 'Belleza' },
];

export const LANDING_CITIES: LandingCity[] = [
  { slug: 'buenos-aires', name: 'Buenos Aires', aliases: ['buenos aires', 'provincia de buenos aires'] },
  { slug: 'caba', name: 'CABA', aliases: ['caba', 'ciudad autonoma de buenos aires', 'capital federal'] },
  { slug: 'cordoba', name: 'Cordoba', aliases: ['cordoba', 'cordoba capital'] },
  { slug: 'rosario', name: 'Rosario', aliases: ['rosario', 'santa fe'] },
  { slug: 'mendoza', name: 'Mendoza', aliases: ['mendoza'] },
  { slug: 'la-plata', name: 'La Plata', aliases: ['la plata'] },
  { slug: 'mar-del-plata', name: 'Mar del Plata', aliases: ['mar del plata'] },
  { slug: 'tucuman', name: 'Tucuman', aliases: ['tucuman', 'san miguel de tucuman'] },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveBank(slug: string | undefined): LandingBank | null {
  if (!slug) return null;
  const normalizedSlug = normalize(slug.replace(/-/g, ' '));
  return LANDING_BANKS.find((bank) => {
    return bank.slug === slug || bank.aliases.some((alias) => normalize(alias) === normalizedSlug);
  }) ?? null;
}

export function resolveCategory(slug: string | undefined): LandingCategory | null {
  if (!slug) return null;
  return LANDING_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function resolveCity(slug: string | undefined): LandingCity | null {
  if (!slug) return null;
  const normalizedSlug = normalize(slug.replace(/-/g, ' '));
  return LANDING_CITIES.find((city) => {
    return city.slug === slug || city.aliases.some((alias) => normalize(alias) === normalizedSlug);
  }) ?? null;
}

export function getLandingPath(bankSlug: string, categorySlug: string, citySlug?: string): string {
  if (citySlug) {
    return `/descuentos/${bankSlug}/${categorySlug}/${citySlug}`;
  }

  return `/descuentos/${bankSlug}/${categorySlug}`;
}

function collectLocationText(business: Business): string[] {
  const parts: string[] = [];

  for (const location of business.location) {
    if (location.formattedAddress) parts.push(location.formattedAddress);
    if (location.name) parts.push(location.name);
    if (location.addressComponents?.locality) parts.push(location.addressComponents.locality);
    if (location.addressComponents?.adminAreaLevel1) parts.push(location.addressComponents.adminAreaLevel1);
    if (location.addressComponents?.adminAreaLevel2) parts.push(location.addressComponents.adminAreaLevel2);
  }

  return parts.map((part) => normalize(part));
}

export function businessMatchesCity(business: Business, city: LandingCity): boolean {
  const locationText = collectLocationText(business);
  return locationText.some((text) => city.aliases.some((alias) => text.includes(normalize(alias))));
}

export function businessMatchesBank(business: Business, bank: LandingBank): boolean {
  const bankNames = business.benefits.map((benefit) => normalize(benefit.bankName || ''));
  return bankNames.some((bankName) => bank.aliases.some((alias) => bankName.includes(normalize(alias))));
}

export function getMaxDiscount(business: Business): number {
  let max = 0;
  for (const benefit of business.benefits) {
    const match = benefit.rewardRate.match(/(\d+)%/);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return max;
}

function resolveCategoryFromBusiness(category: string): LandingCategory | null {
  const normalizedCategory = normalize(category || '');
  if (!normalizedCategory) return null;

  const exactMatch = LANDING_CATEGORIES.find((item) => normalize(item.slug) === normalizedCategory);
  if (exactMatch) return exactMatch;

  return LANDING_CATEGORIES.find((item) => normalizedCategory.includes(normalize(item.slug))) ?? null;
}

function resolvePrimaryBankFromBusiness(business: Business): LandingBank | null {
  if (!business.benefits.length) return null;

  const scores = new Map<string, number>();

  for (const benefit of business.benefits) {
    const bankName = normalize(benefit.bankName || '');
    if (!bankName) continue;

    for (const bank of LANDING_BANKS) {
      if (bank.aliases.some((alias) => bankName.includes(normalize(alias)))) {
        scores.set(bank.slug, (scores.get(bank.slug) ?? 0) + 1);
      }
    }
  }

  let best: LandingBank | null = null;
  let bestScore = 0;
  for (const bank of LANDING_BANKS) {
    const score = scores.get(bank.slug) ?? 0;
    if (score > bestScore) {
      best = bank;
      bestScore = score;
    }
  }

  return best;
}

function resolvePrimaryCityFromBusiness(business: Business): LandingCity | null {
  const locationText = collectLocationText(business);
  if (!locationText.length) return null;

  let bestCity: LandingCity | null = null;
  let bestScore = 0;

  for (const city of LANDING_CITIES) {
    let score = 0;
    for (const text of locationText) {
      for (const alias of city.aliases) {
        if (text.includes(normalize(alias))) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCity = city;
    }
  }

  return bestCity;
}

function compactBankName(bankName: string): string {
  return bankName.replace(/^Banco\s+/i, '').trim();
}

function buildFallbackLandingLinks(maxLinks: number): FeaturedLandingLink[] {
  const links: FeaturedLandingLink[] = [];

  for (const category of LANDING_CATEGORIES) {
    for (const bank of LANDING_BANKS) {
      links.push({
        label: `${compactBankName(bank.name)} en ${category.name}`,
        href: getLandingPath(bank.slug, category.slug),
      });

      if (links.length >= maxLinks) {
        return links;
      }
    }
  }

  return links;
}

export function buildFeaturedLandingLinks(
  businesses: Business[],
  maxLinks = 12,
): FeaturedLandingLink[] {
  if (maxLinks <= 0) return [];

  const candidates = new Map<string, { link: FeaturedLandingLink; score: number }>();

  for (const business of businesses) {
    const bank = resolvePrimaryBankFromBusiness(business);
    const category = resolveCategoryFromBusiness(business.category);
    if (!bank || !category) continue;

    const city = resolvePrimaryCityFromBusiness(business);
    const discountScore = getMaxDiscount(business);
    const coverageScore = business.benefits.length;
    const baseScore = discountScore * 10 + coverageScore;

    const nationalKey = `${bank.slug}:${category.slug}`;
    const nationalLink: FeaturedLandingLink = {
      label: `${compactBankName(bank.name)} en ${category.name}`,
      href: getLandingPath(bank.slug, category.slug),
    };

    const existingNational = candidates.get(nationalKey);
    if (!existingNational || baseScore > existingNational.score) {
      candidates.set(nationalKey, {
        link: nationalLink,
        score: baseScore,
      });
    }

    if (city) {
      const cityKey = `${bank.slug}:${category.slug}:${city.slug}`;
      const cityLink: FeaturedLandingLink = {
        label: `${compactBankName(bank.name)} en ${category.name} (${city.name})`,
        href: getLandingPath(bank.slug, category.slug, city.slug),
      };

      const cityScore = baseScore + 3;
      const existingCity = candidates.get(cityKey);
      if (!existingCity || cityScore > existingCity.score) {
        candidates.set(cityKey, {
          link: cityLink,
          score: cityScore,
        });
      }
    }
  }

  const rankedLinks = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.link);

  const mergedLinks: FeaturedLandingLink[] = [];
  const seenHrefs = new Set<string>();

  for (const link of rankedLinks) {
    if (seenHrefs.has(link.href)) continue;
    seenHrefs.add(link.href);
    mergedLinks.push(link);
    if (mergedLinks.length >= maxLinks) {
      return mergedLinks;
    }
  }

  const fallbackLinks = buildFallbackLandingLinks(maxLinks);
  for (const link of fallbackLinks) {
    if (seenHrefs.has(link.href)) continue;
    seenHrefs.add(link.href);
    mergedLinks.push(link);
    if (mergedLinks.length >= maxLinks) {
      break;
    }
  }

  return mergedLinks;
}
