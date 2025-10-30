// Clean service to match your backend exactly
const BASE_URL = 'http://localhost:3002';

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

    async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
        if (this.cache.has(placeId)) {
            return this.cache.get(placeId)!;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/places/details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ placeId })
            });

            if (!response.ok) {
                console.error(`❌ API Error: ${response.status}`);
                return null;
            }

            const rawResponse = await response.text();
            const backendResponse: BackendResponse = JSON.parse(rawResponse);

            if (!backendResponse.success) {
                return null;
            }

            const googleRaw: GooglePlacesRaw = JSON.parse(backendResponse.result.raw);

            // Transform to our clean format
            const placeDetails: PlaceDetails = {
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



            this.cache.set(placeId, placeDetails);
            return placeDetails;

        } catch (error) {
            console.error('Network error:', error);
            return null;
        }
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