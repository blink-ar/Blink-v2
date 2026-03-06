import { MongoClient, ObjectId } from 'mongodb';

const DEFAULT_COLLECTION = 'confirmed_benefits';
const ALLOWED_COLLECTIONS = new Set([
  'processed_benefits',
  'confirmed_benefits',
  'benefits',
  'bank_subscriptions'
]);

const MERCHANT_ASSETS_COLLECTION = 'merchant_assets';
const DEFAULT_BUSINESS_IMAGE =
  'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400';

const MONGODB_URI_READ_ONLY = process.env.MONGODB_URI_READ_ONLY;
const DATABASE_NAME = process.env.DATABASE_NAME || 'benefitsV3';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

const globalState = globalThis;
if (!globalState.__blinkMongo) {
  globalState.__blinkMongo = {
    clientPromise: null,
    dbPromise: null
  };
}

function json(res, statusCode, payload) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(payload));
}

// Cache-Control directives
const CC_METADATA = 's-maxage=43200, stale-while-revalidate=86400, max-age=3600';  // 12h CDN, 1h browser
const CC_CONTENT  = 's-maxage=3600, stale-while-revalidate=7200, max-age=300';     // 1h CDN, 5m browser
const CC_LOCATION = 'private, max-age=60';                                          // browser-only, 1m

function setCacheControl(res, directive) {
  res.setHeader('Cache-Control', directive);
}

/**
 * Decode a geohash string to its center lat/lng.
 * Returns null if the input is invalid.
 */
function decodeGeohash(hash) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let even = true;
  const lat = [-90, 90];
  const lng = [-180, 180];
  for (const c of hash) {
    const bits = BASE32.indexOf(c);
    if (bits === -1) return null;
    for (let i = 4; i >= 0; i--) {
      const bit = (bits >> i) & 1;
      if (even) { const m = (lng[0] + lng[1]) / 2; if (bit) lng[0] = m; else lng[1] = m; }
      else      { const m = (lat[0] + lat[1]) / 2; if (bit) lat[0] = m; else lat[1] = m; }
      even = !even;
    }
  }
  return { latitude: (lat[0] + lat[1]) / 2, longitude: (lng[0] + lng[1]) / 2 };
}

function getParsedUrl(req) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https';
  const host = req.headers.host || 'localhost';
  return new URL(req.url || '/', `${protocol}://${host}`);
}

function resolveRequestPath(url) {
  if (url.pathname !== '/api/[...path]') {
    return url.pathname;
  }

  const rewrittenPath = url.searchParams.get('path');
  if (!rewrittenPath) {
    return '/api';
  }

  const normalized = rewrittenPath
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean)
    .join('/');

  return `/api/${normalized}`;
}

function getCollectionName(searchParams) {
  const collection = searchParams.get('collection');
  if (collection && ALLOWED_COLLECTIONS.has(collection)) {
    return collection;
  }
  return DEFAULT_COLLECTION;
}

function toPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value || '', 10);
  const safe = Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  return typeof max === 'number' ? Math.min(safe, max) : safe;
}

function shouldIncludeExpired(searchParams) {
  return searchParams.get('includeExpired') === 'true';
}

function getActiveBenefitsMatch(searchParams) {
  if (shouldIncludeExpired(searchParams)) {
    return null;
  }

  const now = new Date();
  return {
    $expr: {
      $let: {
        vars: {
          parsedValidUntil: {
            $convert: {
              input: '$validUntil',
              to: 'date',
              onError: null,
              onNull: null
            }
          }
        },
        in: {
          $or: [
            { $eq: ['$$parsedValidUntil', null] },
            { $gte: ['$$parsedValidUntil', now] }
          ]
        }
      }
    }
  };
}

function applyActiveBenefitsFilter(query, searchParams) {
  const activeMatch = getActiveBenefitsMatch(searchParams);
  if (!activeMatch) {
    return;
  }

  if (Array.isArray(query.$and)) {
    query.$and.push(activeMatch);
    return;
  }

  query.$and = [activeMatch];
}

function serializeDocWithId(doc) {
  return {
    ...doc,
    id: doc?._id?.toString?.() || doc?.id || null
  };
}

async function getDb() {
  if (!MONGODB_URI_READ_ONLY) {
    throw new Error('MONGODB_URI_READ_ONLY environment variable is required');
  }

  if (!globalState.__blinkMongo.clientPromise) {
    const client = new MongoClient(MONGODB_URI_READ_ONLY);
    globalState.__blinkMongo.clientPromise = client.connect();
  }

  if (!globalState.__blinkMongo.dbPromise) {
    globalState.__blinkMongo.dbPromise = globalState.__blinkMongo.clientPromise.then((client) => client.db(DATABASE_NAME));
  }

  return globalState.__blinkMongo.dbPromise;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    if (!req.body.trim()) return {};
    return JSON.parse(req.body);
  }

  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  }

  return {};
}

async function fetchGooglePlaceDetails(placeId) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_address,geometry,types,address_components,rating,user_ratings_total,price_level,opening_hours'
  );
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Place Details API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.result) {
    return null;
  }

  const result = data.result;
  const location = result.geometry?.location;
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null;
  }

  const addressComponents = {};
  if (Array.isArray(result.address_components)) {
    for (const component of result.address_components) {
      for (const type of component.types || []) {
        if (type === 'street_number') addressComponents.streetNumber = component.long_name;
        if (type === 'route') addressComponents.route = component.long_name;
        if (type === 'neighborhood') addressComponents.neighborhood = component.long_name;
        if (type === 'sublocality') addressComponents.sublocality = component.long_name;
        if (type === 'locality') addressComponents.locality = component.long_name;
        if (type === 'administrative_area_level_1') addressComponents.adminAreaLevel1 = component.long_name;
        if (type === 'administrative_area_level_2') addressComponents.adminAreaLevel2 = component.long_name;
        if (type === 'postal_code') addressComponents.postalCode = component.long_name;
        if (type === 'country') {
          addressComponents.country = component.long_name;
          addressComponents.countryCode = component.short_name;
        }
      }
    }
  }

  return {
    placeId: result.place_id,
    lat: location.lat,
    lng: location.lng,
    geohash: undefined,
    formattedAddress: result.formatted_address,
    name: result.name,
    addressComponents,
    types: result.types,
    source: 'name',
    provider: 'google',
    confidence: 1,
    raw: JSON.stringify(result),
    meta: JSON.stringify({
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      price_level: result.price_level,
      opening_hours: result.opening_hours
    }),
    updatedAt: new Date().toISOString()
  };
}

async function handleGetBenefits(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const category = searchParams.get('category');
  const bank = searchParams.get('bank');
  const network = searchParams.get('network');
  const online = searchParams.get('online');
  const search = searchParams.get('search');
  const limitNum = toPositiveInt(searchParams.get('limit'), 50, 100);
  const offsetNum = toPositiveInt(searchParams.get('offset'), 0);

  const query = {};

  if (category && category !== 'all') {
    query.categories = { $in: [category] };
  }

  if (bank) {
    query.bank = { $regex: bank, $options: 'i' };
  }

  if (network) {
    query.network = { $regex: network, $options: 'i' };
  }

  if (online !== null) {
    query.online = online === 'true';
  }

  if (search) {
    query.$or = [
      { benefitTitle: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'merchant.name': { $regex: search, $options: 'i' } }
    ];
  }

  applyActiveBenefitsFilter(query, searchParams);

  const collection = db.collection(collectionName);
  const [benefits, total] = await Promise.all([
    collection.find(query).sort({ _id: -1 }).skip(offsetNum).limit(limitNum).toArray(),
    collection.countDocuments(query)
  ]);

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    benefits: benefits.map(serializeDocWithId),
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    },
    filters: {
      category,
      bank,
      network,
      online,
      search,
      includeExpired
    }
  });
}

async function handleGetBenefitById(req, res, url, db, id) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const collection = db.collection(collectionName);

  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { id };
  }

  const activeMatch = getActiveBenefitsMatch(searchParams);
  const finalQuery = activeMatch ? { $and: [query, activeMatch] } : query;

  const benefit = await collection.findOne(finalQuery);
  if (!benefit) {
    return json(res, 404, {
      error: 'Benefit not found',
      id
    });
  }

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    benefit: serializeDocWithId(benefit)
  });
}

async function handleGetCategories(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const categories = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    categories: categories.map((cat) => ({
      name: cat._id,
      count: cat.count
    }))
  });
}

async function handleGetBanks(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const banks = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $group: { _id: '$bank', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    banks: banks.map((bank) => ({
      name: bank._id,
      count: bank.count
    }))
  });
}

async function handleGetNetworks(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const networks = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $group: { _id: '$network', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    networks: networks.map((network) => ({
      name: network._id,
      count: network.count
    }))
  });
}

async function handleGetStats(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const collection = db.collection(collectionName);
  const activeMatch = getActiveBenefitsMatch(searchParams) || {};

  const [
    totalBenefits,
    onlineBenefits,
    physicalBenefits,
    topCategories,
    topBanks
  ] = await Promise.all([
    collection.countDocuments(activeMatch),
    collection.countDocuments({ ...activeMatch, online: true }),
    collection.countDocuments({ ...activeMatch, online: false }),
    collection
      .aggregate([
        ...(Object.keys(activeMatch).length > 0 ? [{ $match: activeMatch }] : []),
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
      .toArray(),
    collection
      .aggregate([
        ...(Object.keys(activeMatch).length > 0 ? [{ $match: activeMatch }] : []),
        { $group: { _id: '$bank', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
      .toArray()
  ]);

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    stats: {
      totalBenefits,
      onlineBenefits,
      physicalBenefits,
      topCategories: topCategories.map((cat) => ({
        category: cat._id,
        count: cat.count
      })),
      topBanks: topBanks.map((bank) => ({
        bank: bank._id,
        count: bank.count
      }))
    }
  });
}

async function handleGetNearbyBenefits(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radiusMeters = toPositiveInt(searchParams.get('radius'), 5000);
  const category = searchParams.get('category');
  const limitNum = Math.min(toPositiveInt(searchParams.get('limit'), 20), 50);

  if (!lat || !lng) {
    return json(res, 400, {
      error: 'Missing required parameters: lat, lng'
    });
  }

  const latitude = Number.parseFloat(lat);
  const longitude = Number.parseFloat(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json(res, 400, {
      error: 'Invalid coordinates: lat and lng must be numbers'
    });
  }

  const baseMatch = {};
  const activeMatch = getActiveBenefitsMatch(searchParams);
  if (activeMatch) {
    Object.assign(baseMatch, activeMatch);
  }
  if (category && category !== 'all') {
    baseMatch.categories = { $in: [category] };
  }

  const nearbyPipeline = [
    ...(Object.keys(baseMatch).length > 0 ? [{ $match: baseMatch }] : []),
    { $unwind: '$locations' },
    {
      $match: {
        'locations.lat': { $type: 'number' },
        'locations.lng': { $type: 'number' }
      }
    },
    {
      $addFields: {
        _distanceMeters: {
          $multiply: [
            6371000,
            {
              $acos: {
                $add: [
                  {
                    $multiply: [
                      { $sin: { $degreesToRadians: latitude } },
                      { $sin: { $degreesToRadians: '$locations.lat' } }
                    ]
                  },
                  {
                    $multiply: [
                      { $cos: { $degreesToRadians: latitude } },
                      { $cos: { $degreesToRadians: '$locations.lat' } },
                      {
                        $cos: {
                          $degreesToRadians: { $subtract: ['$locations.lng', longitude] }
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      $match: {
        _distanceMeters: { $lte: radiusMeters }
      }
    },
    {
      $sort: {
        _distanceMeters: 1
      }
    },
    {
      $group: {
        _id: '$_id',
        doc: { $first: '$$ROOT' },
        distance: { $min: '$_distanceMeters' }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            { distanceMeters: '$distance' }
          ]
        }
      }
    },
    {
      $project: {
        _distanceMeters: 0
      }
    },
    { $limit: limitNum }
  ];

  const nearbyBenefits = await db.collection(collectionName)
    .aggregate(nearbyPipeline)
    .toArray();

  const filtered = nearbyBenefits.map(serializeDocWithId);

  setCacheControl(res, CC_LOCATION);
  return json(res, 200, {
    success: true,
    benefits: filtered,
    count: filtered.length,
    searchParams: {
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      category,
      includeExpired
    }
  });
}

async function handleGetBusinesses(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const category = searchParams.get('category');
  const bank = searchParams.get('bank');
  const search = searchParams.get('search');
  const limitNum = Math.min(Math.max(toPositiveInt(searchParams.get('limit'), 20), 1), 100);
  const offsetNum = Math.max(toPositiveInt(searchParams.get('offset'), 0), 0);

  const geohash = searchParams.get('geohash');
  const decoded = geohash ? decodeGeohash(geohash) : null;
  const userLat = decoded?.latitude ?? null;
  const userLng = decoded?.longitude ?? null;
  const hasLocation = userLat !== null && userLng !== null;

  const bankFilter = bank
    ? bank
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    : null;

  const matchStage = {};
  if (category && category !== 'all') {
    matchStage.categories = { $in: [category] };
  }

  if (search) {
    matchStage.$or = [
      { 'merchant.name': { $regex: search, $options: 'i' } },
      { benefitTitle: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'locations.name': { $regex: search, $options: 'i' } }
    ];
  }

  const activeMatch = getActiveBenefitsMatch(searchParams);
  const pipeline = [
    ...(activeMatch ? [{ $match: activeMatch }] : []),
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $match: {
        'merchant.name': { $exists: true, $nin: [null, ''] }
      }
    },
    // Stage 1.7: Resolve cardTypes IDs to card names via bank_cards collection
    {
      $lookup: {
        from: 'bank_cards',
        let: { cardTypeIds: { $ifNull: ['$cardTypes', []] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [{ $toString: '$_id' }, '$$cardTypeIds']
              }
            }
          },
          {
            $project: {
              _id: 0,
              name: { $concat: ['$issuer', ' ', '$tier'] }
            }
          }
        ],
        as: 'resolvedCards'
      }
    },
    {
      $group: {
        _id: '$merchant.name',
        name: { $first: '$merchant.name' },
        category: { $first: { $arrayElemAt: ['$categories', 0] } },
        description: { $first: '$description' },
        allLocations: { $push: '$locations' },
        benefits: {
          $push: {
            id: '$id',
            bankName: { $ifNull: ['$bank', 'Banco'] },
            cardName: {
              $ifNull: [
                { $arrayElemAt: ['$resolvedCards.name', 0] },
                'Tarjeta de crédito'
              ]
            },
            cardTypes: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$resolvedCards', []] } }, 0] },
                then: { $setUnion: ['$resolvedCards.name', []] },
                else: []
              }
            },
            benefit: '$benefitTitle',
            rewardRate: { $concat: [{ $toString: { $ifNull: ['$discountPercentage', 0] } }, '%'] },
            tipo: 'descuento',
            cuando: {
              $reduce: {
                input: { $ifNull: ['$availableDays', []] },
                initialValue: '',
                in: {
                  $cond: {
                    if: { $eq: ['$$value', ''] },
                    then: '$$this',
                    else: { $concat: ['$$value', ', ', '$$this'] }
                  }
                }
              }
            },
            valor: { $concat: [{ $toString: { $ifNull: ['$discountPercentage', 0] } }, '%'] },
            tope: { $ifNull: [{ $arrayElemAt: ['$caps.amount', 0] }, null] },
            condicion: '$termsAndConditions',
            requisitos: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$resolvedCards', []] } }, 0] },
                then: { $setUnion: ['$resolvedCards.name', []] },
                else: ['Tarjeta de crédito']
              }
            },
            usos: {
              $cond: {
                if: { $eq: ['$online', true] },
                then: ['online', 'presencial'],
                else: ['presencial']
              }
            },
            textoAplicacion: '$link',
            description: '$description',
            installments: '$installments',
            validUntil: '$validUntil',
            caps: '$caps',
            otherDiscounts: '$otherDiscounts',
            subscription: '$subscription'
          }
        }
      }
    },
    {
      $addFields: {
        id: {
          $toLower: {
            $replaceAll: {
              input: {
                $replaceAll: {
                  input: { $ifNull: ['$name', 'unknown'] },
                  find: "'",
                  replacement: ''
                }
              },
              find: ' ',
              replacement: '-'
            }
          }
        },
        locations: {
          $reduce: {
            input: { $ifNull: ['$allLocations', []] },
            initialValue: [],
            in: { $concatArrays: ['$$value', { $ifNull: ['$$this', []] }] }
          }
        }
      }
    },
    {
      $lookup: {
        from: MERCHANT_ASSETS_COLLECTION,
        let: {
          merchantName: '$name'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$isActive', false] },
                  {
                    $or: [
                      {
                        $eq: [
                          '$merchantKey',
                          {
                            $toLower: {
                              $trim: {
                                input: { $ifNull: ['$$merchantName', ''] }
                              }
                            }
                          }
                        ]
                      },
                      {
                        $eq: [
                          {
                            $toLower: {
                              $trim: {
                                input: { $ifNull: ['$merchantName', ''] }
                              }
                            }
                          },
                          {
                            $toLower: {
                              $trim: {
                                input: { $ifNull: ['$$merchantName', ''] }
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          { $sort: { priority: -1, updatedAt: -1, createdAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              _id: 0,
              merchantName: 1,
              merchantKey: 1,
              imageUrl: 1,
              logoUrl: 1,
              coverUrl: 1,
              source: 1
            }
          }
        ],
        as: 'merchantAsset'
      }
    },
    {
      $addFields: {
        merchantAsset: { $first: '$merchantAsset' }
      }
    },
    {
      $addFields: {
        image: {
          $ifNull: [
            '$merchantAsset.logoUrl',
            {
              $ifNull: [
                '$merchantAsset.coverUrl',
                {
                  $ifNull: [
                    '$merchantAsset.imageUrl',
                    DEFAULT_BUSINESS_IMAGE
                  ]
                }
              ]
            }
          ]
        },
        logo: '$merchantAsset.logoUrl',
        coverImage: '$merchantAsset.coverUrl',
        rating: 5,
        category: { $ifNull: ['$category', 'otros'] },
        description: { $ifNull: ['$description', ''] }
      }
    },
    ...(bankFilter && bankFilter.length > 0
      ? [{
          $match: {
            'benefits.bankName': {
              $in: bankFilter.map((value) => new RegExp(value, 'i'))
            }
          }
        }]
      : []),
    ...(hasLocation
      ? [
          {
            $addFields: {
              locationDistances: {
                $map: {
                  input: '$locations',
                  as: 'loc',
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ['$$loc.lat', 0] },
                          { $ne: ['$$loc.lng', 0] },
                          { $ne: ['$$loc.lat', null] },
                          { $ne: ['$$loc.lng', null] }
                        ]
                      },
                      then: {
                        $multiply: [
                          6371,
                          {
                            $acos: {
                              $add: [
                                {
                                  $multiply: [
                                    { $sin: { $multiply: [{ $degreesToRadians: userLat }, 1] } },
                                    { $sin: { $degreesToRadians: '$$loc.lat' } }
                                  ]
                                },
                                {
                                  $multiply: [
                                    { $cos: { $multiply: [{ $degreesToRadians: userLat }, 1] } },
                                    { $cos: { $degreesToRadians: '$$loc.lat' } },
                                    { $cos: { $degreesToRadians: { $subtract: ['$$loc.lng', userLng] } } }
                                  ]
                                }
                              ]
                            }
                          }
                        ]
                      },
                      else: null
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              distance: {
                $let: {
                  vars: {
                    validDistances: {
                      $filter: {
                        input: '$locationDistances',
                        as: 'dist',
                        cond: { $ne: ['$$dist', null] }
                      }
                    }
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: '$$validDistances' }, 0] },
                      then: { $min: '$$validDistances' },
                      else: null
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              distanceText: {
                $cond: {
                  if: { $ne: ['$distance', null] },
                  then: {
                    $cond: {
                      if: { $lt: ['$distance', 1] },
                      then: {
                        $concat: [
                          { $toString: { $round: { $multiply: ['$distance', 1000] } } },
                          'm'
                        ]
                      },
                      else: {
                        $cond: {
                          if: { $lt: ['$distance', 10] },
                          then: {
                            $concat: [
                              { $toString: { $round: ['$distance', 1] } },
                              'km'
                            ]
                          },
                          else: {
                            $concat: [
                              { $toString: { $round: ['$distance', 0] } },
                              'km'
                            ]
                          }
                        }
                      }
                    }
                  },
                  else: null
                }
              },
              isNearby: {
                $cond: {
                  if: { $and: [{ $ne: ['$distance', null] }, { $lte: ['$distance', 50] }] },
                  then: true,
                  else: false
                }
              }
            }
          }
        ]
      : []),
    {
      $project: {
        _id: 0,
        allLocations: 0,
        locationDistances: 0,
        merchantAsset: 0
      }
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        businesses: [
          ...(hasLocation
            ? [
                {
                  $addFields: {
                    sortKey: {
                      $cond: {
                        if: { $eq: ['$distance', null] },
                        then: 999999,
                        else: '$distance'
                      }
                    }
                  }
                },
                { $sort: { sortKey: 1, name: 1 } },
                { $project: { sortKey: 0 } }
              ]
            : [{ $sort: { name: 1 } }]),
          { $skip: offsetNum },
          { $limit: limitNum }
        ]
      }
    }
  ];

  const result = await db.collection(collectionName).aggregate(pipeline).toArray();
  const total = result[0]?.metadata?.[0]?.total || 0;
  const businesses = result[0]?.businesses || [];

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    businesses,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + businesses.length < total
    },
    filters: {
      ...(category && { category }),
      ...(bank && { bank }),
      ...(search && { search }),
      includeExpired,
      ...(hasLocation && { lat: userLat, lng: userLng })
    }
  });
}

async function handlePlaceDetails(req, res) {
  const body = await readJsonBody(req);
  const placeId = body?.placeId;

  if (!placeId || typeof placeId !== 'string') {
    return json(res, 400, {
      error: 'Missing required field: placeId'
    });
  }

  const result = await fetchGooglePlaceDetails(placeId);
  if (!result) {
    return json(res, 404, {
      error: 'Place not found',
      placeId
    });
  }

  return json(res, 200, {
    success: true,
    result
  });
}

export default async function handler(req, res) {
  const url = getParsedUrl(req);
  const path = resolveRequestPath(url);

  try {
    const db = await getDb();

    if (req.method === 'GET' && path === '/api/benefits') {
      return await handleGetBenefits(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/benefits/nearby') {
      return await handleGetNearbyBenefits(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/businesses') {
      return await handleGetBusinesses(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/categories') {
      return await handleGetCategories(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/banks') {
      return await handleGetBanks(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/networks') {
      return await handleGetNetworks(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/stats') {
      return await handleGetStats(req, res, url, db);
    }

    if (req.method === 'POST' && path === '/api/places/details') {
      return await handlePlaceDetails(req, res);
    }

    if (req.method === 'GET') {
      const benefitByIdMatch = path.match(/^\/api\/benefits\/([^/]+)$/);
      if (benefitByIdMatch) {
        return await handleGetBenefitById(req, res, url, db, decodeURIComponent(benefitByIdMatch[1]));
      }
    }

    return json(res, 404, {
      error: 'Endpoint not found',
      path,
      availableEndpoints: [
        'GET /api/benefits',
        'GET /api/benefits/:id',
        'GET /api/benefits/nearby',
        'GET /api/businesses',
        'GET /api/categories',
        'GET /api/banks',
        'GET /api/networks',
        'GET /api/stats',
        'POST /api/places/details'
      ]
    });
  } catch (error) {
    console.error('[Vercel API] Request failed:', error);
    return json(res, 500, {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
