import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

interface BankItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BankGridProps {
  banks: readonly BankItem[] | BankItem[];
  onBankSelect: (bank: BankItem) => void;
  selectedBanks: string[];
}

const BankGrid: React.FC<BankGridProps> = ({
  banks,
  onBankSelect,
  selectedBanks,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {banks.map((bank) => {
          const isSelected = selectedBanks.includes(bank.id);
          return (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: bank.color + '15', borderColor: bank.color },
              ]}
              onPress={() => onBankSelect(bank as BankItem)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{bank.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: bank.color, fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {bank.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 4,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: '500',
  },
});

export default BankGrid;
