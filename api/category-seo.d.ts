export interface SeoCategory {
  slug: string;
  category: string;
  label: string;
  description: string;
  aliases?: string[];
}

export interface CategorySeoMerchant {
  merchantId: string;
  merchantName: string;
  categories?: string[];
  banks?: string[];
  locations?: Record<string, unknown>[];
  benefitCount?: number;
  activeBenefitCount?: number;
  maxDiscountPercentage?: number;
}

type Projection = Record<string, number | { $slice: number }>;
interface CategorySeoCursor<T> {
  sort(value: Record<string, number>): CategorySeoCursor<T>;
  skip(value: number): CategorySeoCursor<T>;
  limit(value: number): CategorySeoCursor<T>;
  toArray(): Promise<T[]>;
}
interface CategorySeoDb<T> {
  collection(name: string): {
    countDocuments(query: Record<string, unknown>): Promise<number>;
    find(query: Record<string, unknown>, options: { projection: Projection }): CategorySeoCursor<T>;
  };
}

export function resolveSeoCategory(value: unknown): SeoCategory | null;
export function renderCategorySeoHtml(options: {
  appShell: string;
  category: SeoCategory;
  merchants: CategorySeoMerchant[];
  total: number;
  page: number;
  path?: string;
  siteUrl?: string;
}): string;
export function loadCategorySeoData<T extends CategorySeoMerchant>(options: {
  db: CategorySeoDb<T>;
  merchantCollectionName: string;
  category: SeoCategory;
  page: number;
}): Promise<{
  total: number;
  totalPages: number;
  merchants: T[];
  page: number;
  outOfRange: boolean;
}>;
