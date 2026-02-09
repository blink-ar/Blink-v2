import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Platform } from 'react-native';
import { MapPin, Phone, Globe, Clock, Navigation } from 'lucide-react-native';
import { Business, CanonicalLocation } from '../types';
import { colors, borderRadius, shadows } from '../constants/theme';

interface StoreInformationProps {
  business: Business;
  selectedLocation: CanonicalLocation | null;
  onLocationSelect: (location: CanonicalLocation) => void;
}

const StoreInformation: React.FC<StoreInformationProps> = ({
  business,
  selectedLocation,
  onLocationSelect,
}) => {
  const validLocations = business.location.filter(
    (loc) => loc.lat !== 0 || loc.lng !== 0
  );

  const openInMaps = (loc: CanonicalLocation) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${loc.lat},${loc.lng}`,
      android: `geo:${loc.lat},${loc.lng}?q=${loc.lat},${loc.lng}(${business.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (url: string) => {
    Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
  };

  return (
    <View style={styles.container}>
      {/* Locations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicaciones</Text>
        {validLocations.length > 0 ? (
          validLocations.map((loc, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.locationCard,
                shadows.sm,
                selectedLocation?.placeId === loc.placeId && styles.locationSelected,
              ]}
              onPress={() => onLocationSelect(loc)}
              activeOpacity={0.7}
            >
              <View style={styles.locationContent}>
                <MapPin size={16} color={colors.primary[600]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress} numberOfLines={2}>
                    {loc.formattedAddress || 'Dirección no disponible'}
                  </Text>
                  {loc.name && <Text style={styles.locationName}>{loc.name}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => openInMaps(loc)}
              >
                <Navigation size={14} color={colors.blue[600]} />
                <Text style={styles.directionsText}>Ir</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noData}>No hay ubicaciones disponibles</Text>
        )}
      </View>

      {/* Contact Info */}
      {selectedLocation?.placeDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          {selectedLocation.placeDetails.phoneNumber && (
            <TouchableOpacity
              style={[styles.contactRow, shadows.sm]}
              onPress={() => callPhone(selectedLocation.placeDetails!.phoneNumber!)}
            >
              <Phone size={16} color={colors.green[600]} />
              <Text style={styles.contactText}>
                {selectedLocation.placeDetails.phoneNumber}
              </Text>
            </TouchableOpacity>
          )}

          {selectedLocation.placeDetails.website && (
            <TouchableOpacity
              style={[styles.contactRow, shadows.sm]}
              onPress={() => openWebsite(selectedLocation.placeDetails!.website!)}
            >
              <Globe size={16} color={colors.blue[600]} />
              <Text style={styles.contactText} numberOfLines={1}>
                {selectedLocation.placeDetails.website}
              </Text>
            </TouchableOpacity>
          )}

          {selectedLocation.placeDetails.openingHours && (
            <View style={[styles.hoursCard, shadows.sm]}>
              <View style={styles.hoursHeader}>
                <Clock size={16} color={colors.primary[600]} />
                <Text style={styles.hoursTitle}>Horarios</Text>
              </View>
              {Object.entries(selectedLocation.placeDetails.openingHours)
                .filter(([key]) => !['isOpen', 'currentStatus'].includes(key))
                .map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.dayText}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    <Text style={styles.hoursText}>{hours as string}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  locationSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.gray[800],
    lineHeight: 18,
  },
  locationName: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blue[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue[600],
  },
  noData: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  contactText: {
    fontSize: 13,
    color: colors.gray[800],
    flex: 1,
  },
  hoursCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});

export default StoreInformation;
