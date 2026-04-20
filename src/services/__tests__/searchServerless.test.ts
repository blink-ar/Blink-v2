import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSearchDatasetFromMerchantDocs } from '../../../api/search/entities.js';

const { meiliSearchMock, isMeilisearchConfiguredMock } = vi.hoisted(() => ({
  meiliSearchMock: vi.fn(),
  isMeilisearchConfiguredMock: vi.fn()
}));

vi.mock('../../../api/search/meilisearch.js', () => ({
  meiliSearch: meiliSearchMock,
  isMeilisearchConfigured: isMeilisearchConfiguredMock
}));

import { handleSearch } from '../../../api/[...path].js';

function createResponseCapture() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: null as string | null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload: string) {
      this.body = payload;
      return this;
    }
  };
}

function createCursor<T>(data: T[]) {
  const cursor = {
    sort() {
      return cursor;
    },
    limit() {
      return cursor;
    },
    async toArray() {
      return data;
    }
  };
  return cursor;
}

function buildMerchantDoc(merchantId: string, merchantName: string, rankingScore?: number) {
  const merchant = {
    merchantId,
    merchantName,
    merchantKey: merchantName.toLowerCase(),
    categories: ['shopping'],
    banks: ['galicia'],
    locations: [],
    activeBenefitCount: merchantName === 'Ver' ? 2 : 8,
    benefitCount: merchantName === 'Ver' ? 2 : 8,
    hasOnlineBenefits: false,
    maxDiscountPercentage: merchantName === 'Ver' ? 25 : 10,
    searchProfile: {
      aliases: [merchantName.toLowerCase()],
      description: merchantName === 'Ver'
        ? 'Todos los viernes en los comercios adheridos.'
        : `${merchantName} description`,
      benefits: []
    },
    imageUrl: '',
    logoUrl: '',
    coverUrl: ''
  };

  const document = buildSearchDatasetFromMerchantDocs([merchant]).merchantDocuments[0];
  return rankingScore === undefined ? merchant : { ...document, _rankingScore: rankingScore };
}

describe('handleSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rescues an exact-name merchant that meilisearch omitted from merchant candidates', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({
        hits: [
          buildMerchantDoc('merchant_ver_posadas', 'Ver Posadas', 1),
          buildMerchantDoc('merchant_vercelli', 'VERCELLI', 0.9)
        ],
        estimatedTotalHits: 2000
      })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({
        hits: [
          {
            entityId: 'product_ver',
            merchantRefs: ['merchant_seeded'],
            categories: [],
            _rankingScore: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        hits: [
          buildMerchantDoc('merchant_seeded', 'Verde Promo', 0.8)
        ]
      });

    let merchantFindCount = 0;
    const db = {
      collection(name: string) {
        if (name !== 'merchant_assets') {
          throw new Error(`Unexpected collection: ${name}`);
        }

        return {
          find() {
            merchantFindCount += 1;
            if (merchantFindCount === 1) {
              return createCursor([buildMerchantDoc('merchant_69a6f702b7ff0ecb9e33cf35', 'Ver')]);
            }
            return createCursor([buildMerchantDoc('merchant_ver_posadas', 'Ver Posadas')]);
          }
        };
      }
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=VER&limit=20&offset=0&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.source).toBe('meilisearch');
    expect(payload.merchants[0].merchantId).toBe('merchant_69a6f702b7ff0ecb9e33cf35');
    expect(payload.merchants[0].merchantName).toBe('Ver');
    expect(payload.merchants[0].reasons).toContain('merchant_exact');
    expect(payload.merchants.some((merchant: { merchantId: string }) => merchant.merchantId === 'merchant_69a6f702b7ff0ecb9e33cf35')).toBe(true);
    expect(merchantFindCount).toBe(2);
    expect(meiliSearchMock).toHaveBeenCalledTimes(4);
  });
});
