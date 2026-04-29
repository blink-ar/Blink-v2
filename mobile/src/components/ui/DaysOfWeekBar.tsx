import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { parseDayAvailability } from '../../utils/dayAvailabilityParser';

const DAYS = [
  { key: 'monday', label: 'L' },
  { key: 'tuesday', label: 'M' },
  { key: 'wednesday', label: 'X' },
  { key: 'thursday', label: 'J' },
  { key: 'friday', label: 'V' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
] as const;

interface DaysOfWeekBarProps {
  cuando?: string;
  compact?: boolean;
}

export function DaysOfWeekBar({ cuando, compact = false }: DaysOfWeekBarProps) {
  const availability = parseDayAvailability(cuando);

  if (!availability) return null;

  const todayIndex = new Date().getDay();
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayKeys[todayIndex];

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {DAYS.map(({ key, label }) => {
        const active = availability.allDays || availability[key];
        const isToday = key === todayKey;
        return (
          <View
            key={key}
            style={[
              styles.day,
              active && styles.dayActive,
              isToday && active && styles.dayToday,
              compact && styles.dayCompact,
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                active && styles.dayLabelActive,
                isToday && active && styles.dayLabelToday,
                compact && styles.dayLabelCompact,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  compact: {
    gap: 4,
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: '#EEF2FF',
  },
  dayToday: {
    backgroundColor: '#6366F1',
  },
  dayCompact: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayLabelActive: {
    color: '#6366F1',
  },
  dayLabelToday: {
    color: '#fff',
  },
  dayLabelCompact: {
    fontSize: 10,
  },
});
