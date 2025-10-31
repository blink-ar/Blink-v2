// Clean service to match your backend exactly
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Backend response structure
interface BackendResponse {
    success: boolean;
    result: {
        placeId: string;
        name: string;
        formattedAddress: string;
        lat: number;
        lng: number;
        types: string[];
        raw: string; // Contains the Google Places API response as JSON string
        meta: string; // Contains additional metadata as JSON string
    };
}

// Parsed Google Places data from the raw field
interface GooglePlacesRaw {
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
    };
    photos?: Array<{
        photo_reference: string;
        width: number;
        height: number;
    }>;
}

// Clean interface for our app
export interface PlaceDetails {
    placeId: string;
    name: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    rating?: number;
    userRatingsTotal?: number;
    formattedPhoneNumber?: string;
    website?: string;
    openingHours?: string[];
    isOpenNow?: boolean;
    types: string[];
    photos?: Array<{
        reference: string;
        width: number;
        height: number;
    }>;
}

export interface FormattedOpeningHours {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
    isOpen?: boolean;
    currentStatus?: string;
}

export interface FormattedPlaceDetails {
    placeId: string;
    name: string;
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    contact?: {
        phone?: string;
        website?: string;
    };
    rating?: {
        score: number;
        totalReviews: number;
    };
    hours?: FormattedOpeningHours;
    categories?: string[];
    photos?: Array<{
        reference: string;
        width: number;
        height: number;
    }>;
}

class GooglePlacesService {
    private cache = new Map<string, PlaceDetails>();
    private placesService: any = null;

    private async initializePlacesService() {
        if (this.placesService) return this.placesService;

        try {
            // Import Google Maps loader
            const { getGoogleMaps } = await import('./googleMapsLoader');
            const google = await getGoogleMaps();

            // Create a temporary div for the PlacesService (required by Google)
            const tempDiv = document.createElement('div');
            this.placesService = new google.maps.places.PlacesService(tempDiv);

            return this.placesService;
        } catch (error) {
            console.error('Failed to initialize Places Service:', error);
            throw error;
        }
    }

    async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
        if (this.cache.has(placeId)) {
            return this.cache.get(placeId)!;
        }

        try {
            // Try backend first (for compatibility)
            const backendResult = await this.getPlaceDetailsFromBackend(placeId);
            if (backendResult) {
                this.cache.set(placeId, backendResult);
                return backendResult;
            }
        } catch (error) {
            console.warn('Backend API failed, trying direct Google Places API:', error);
        }

        // Fallback to direct Google Places API
        try {
            const directResult = await this.getPlaceDetailsFromGoogle(placeId);
            if (directResult) {
                this.cache.set(placeId, directResult);
                return directResult;
            }
        } catch (error) {
            console.error('Direct Google Places API also failed:', error);
        }

        return null;
    }

    private async getPlaceDetailsFromBackend(placeId: string): Promise<PlaceDetails | null> {
        const response = await fetch(`${BASE_URL}/api/places/details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ placeId })
        });

        if (!response.ok) {
            throw new Error(`Backend API Error: ${response.status}`);
        }

        const rawResponse = await response.text();
        const backendResponse: BackendResponse = JSON.parse(rawResponse);

        if (!backendResponse.success) {
            throw new Error('Backend returned unsuccessful response');
        }

        const googleRaw: GooglePlacesRaw = JSON.parse(backendResponse.result.raw);

        return {
            placeId: backendResponse.result.placeId,
            name: backendResponse.result.name,
            formattedAddress: backendResponse.result.formattedAddress,
            lat: backendResponse.result.lat,
            lng: backendResponse.result.lng,
            types: backendResponse.result.types,
            rating: googleRaw.rating,
            userRatingsTotal: googleRaw.user_ratings_total,
            formattedPhoneNumber: googleRaw.formatted_phone_number,
            website: googleRaw.website,
            openingHours: googleRaw.opening_hours?.weekday_text,
            isOpenNow: googleRaw.opening_hours?.open_now,
            photos: googleRaw.photos?.map(photo => ({
                reference: photo.photo_reference,
                width: photo.width,
                height: photo.height
            }))
        };
    }

    private async getPlaceDetailsFromGoogle(placeId: string): Promise<PlaceDetails | null> {
        const placesService = await this.initializePlacesService();

        return new Promise((resolve) => {
            const request = {
                placeId: placeId,
                fields: [
                    'place_id',
                    'name',
                    'formatted_address',
                    'geometry',
                    'rating',
                    'user_ratings_total',
                    'formatted_phone_number',
                    'website',
                    'opening_hours',
                    'types',
                    'photos'
                ]
            };

            placesService.getDetails(request, (place: any, status: any) => {
                const google = (window as any).google;
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    const placeDetails: PlaceDetails = {
                        placeId: place.place_id,
                        name: place.name,
                        formattedAddress: place.formatted_address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        types: place.types || [],
                        rating: place.rating,
                        userRatingsTotal: place.user_ratings_total,
                        formattedPhoneNumber: place.formatted_phone_number,
                        website: place.website,
                        openingHours: place.opening_hours?.weekday_text,
                        isOpenNow: place.opening_hours?.open_now,
                        photos: place.photos?.map((photo: unknown) => ({
                            reference: photo.getUrl({ maxWidth: 400, maxHeight: 400 }),
                            width: 400,
                            height: 400
                        }))
                    };
                    resolve(placeDetails);
                } else {
                    console.error('Places service failed:', status);
                    resolve(null);
                }
            });
        });
    }

    formatOpeningHours(openingHours?: string[]): FormattedOpeningHours {
        if (!openingHours?.length) {
            return {};
        }

        const formatted: FormattedOpeningHours = {};
        const dayMap: Record<string, keyof Omit<FormattedOpeningHours, 'isOpen' | 'currentStatus'>> = {
            'Monday': 'monday',
            'Tuesday': 'tuesday',
            'Wednesday': 'wednesday',
            'Thursday': 'thursday',
            'Friday': 'friday',
            'Saturday': 'saturday',
            'Sunday': 'sunday'
        };

        openingHours.forEach(dayText => {
            const [dayName, hours] = dayText.split(': ');
            const dayKey = dayMap[dayName];
            if (dayKey) {
                formatted[dayKey] = hours || 'Closed';
            }
        });

        // Current status
        const now = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = dayNames[now.getDay()];
        const todayHours = openingHours.find(h => h.startsWith(todayName));

        if (todayHours) {
            const [, hours] = todayHours.split(': ');
            const isClosed = hours === 'Closed' || !hours;
            formatted.isOpen = !isClosed;
            formatted.currentStatus = isClosed ? 'Cerrado ahora' : 'Abierto ahora';
        }

        return formatted;
    }

    formatPlaceDetails(placeDetails: PlaceDetails): FormattedPlaceDetails {
        return {
            placeId: placeDetails.placeId,
            name: placeDetails.name,
            address: placeDetails.formattedAddress,
            coordinates: {
                lat: placeDetails.lat,
                lng: placeDetails.lng
            },
            contact: {
                phone: placeDetails.formattedPhoneNumber,
                website: placeDetails.website
            },
            rating: placeDetails.rating ? {
                score: placeDetails.rating,
                totalReviews: placeDetails.userRatingsTotal || 0
            } : undefined,
            hours: this.formatOpeningHours(placeDetails.openingHours),
            categories: placeDetails.types,
            photos: placeDetails.photos
        };
    }

    async getFormattedPlaceDetails(placeId: string): Promise<FormattedPlaceDetails | null> {
        const placeDetails = await this.getPlaceDetails(placeId);
        if (!placeDetails) {
            return null;
        }

        return this.formatPlaceDetails(placeDetails);
    }

    clearCache() {
        this.cache.clear();
    }
}

export const googlePlacesService = new GooglePlacesService();

// Test function for console - temporarily commented out
// (window as unknown).testPlaces = (placeId: string) => {
//     return googlePlacesService.getPlaceDetails(placeId);
// };