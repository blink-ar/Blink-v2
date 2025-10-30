import { useState, useEffect } from 'react';
import { CanonicalLocation } from '../types';
import { googlePlacesService, PlaceDetails, FormattedPlaceDetails } from '../services/googlePlacesService';

export const usePlaceDetails = (location: CanonicalLocation | null) => {
    const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
    const [formattedDetails, setFormattedDetails] = useState<FormattedPlaceDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlaceDetails = async () => {
            if (!location?.placeId) {
                setPlaceDetails(null);
                setFormattedDetails(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [rawDetails, formatted] = await Promise.all([
                    googlePlacesService.getPlaceDetails(location.placeId),
                    googlePlacesService.getFormattedPlaceDetails(location.placeId)
                ]);

                setPlaceDetails(rawDetails);
                setFormattedDetails(formatted);
            } catch (err) {
                console.error('Error fetching place details:', err);
                setError('Failed to load place details');
            } finally {
                setLoading(false);
            }
        };

        fetchPlaceDetails();
    }, [location?.placeId]);

    // Legacy compatibility - extract formatted hours from formatted details
    const formattedOpeningHours = formattedDetails?.hours || null;

    return {
        placeDetails,
        formattedDetails,
        formattedOpeningHours,
        loading,
        error
    };
};