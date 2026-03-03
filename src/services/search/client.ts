import {
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_SEARCH_SECTION_LIMIT,
  SEARCH_API_PATH
} from './config';
import { SearchApiResponse } from '../../types';

export interface SearchQueryOptions {
  q: string;
  limit?: number;
  offset?: number;
  lat?: number;
  lng?: number;
  bank?: string;
  category?: string;
  debug?: boolean;
}

export async function fetchSearchResults(options: SearchQueryOptions): Promise<SearchApiResponse> {
  const params = new URLSearchParams();
  params.append('q', options.q);
  params.append('limit', String(options.limit ?? DEFAULT_SEARCH_LIMIT));
  params.append('offset', String(options.offset ?? 0));
  params.append('sectionLimit', String(DEFAULT_SEARCH_SECTION_LIMIT));

  if (options.lat !== undefined && options.lng !== undefined) {
    params.append('lat', String(options.lat));
    params.append('lng', String(options.lng));
  }
  if (options.bank) params.append('bank', options.bank);
  if (options.category) params.append('category', options.category);
  if (options.debug) params.append('debug', '1');

  const response = await fetch(`${SEARCH_API_PATH}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  return response.json();
}
