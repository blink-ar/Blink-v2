import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, borderRadius, shadows } from '../../constants/theme';

interface FilterMenuProps {
  visible: boolean;
  onClose: () => void;
  onlineOnly: boolean;
  onOnlineChange: (val: boolean) => void;
  minDiscount?: number;
  onMinDiscountChange: (val: number | undefined) => void;
  cardMode?: 'credit' | 'debit';
  onCardModeChange: (val: 'credit' | 'debit' | undefined) => void;
  hasInstallments?: boolean;
  onHasInstallmentsChange: (val: boolean | undefined) => void;
  onClearAll: () => void;
}

export const FilterMenu: React.FC<FilterMenuProps> = ({
  visible,
  onClose,
  onlineOnly,
  onOnlineChange,
  minDiscount,
  onMinDiscountChange,
  cardMode,
  onCardModeChange,
  hasInstallments,
  onHasInstallmentsChange,
  onClearAll,
}) => {
  const discountOptions = [10, 20, 30, 50];
  const cardModes = [
    { value: 'credit' as const, label: 'Crédito' },
    { value: 'debit' as const, label: 'Débito' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, shadows.lg]}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Online Only */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              <TouchableOpacity
                style={[styles.chip, onlineOnly && styles.chipActive]}
                onPress={() => onOnlineChange(!onlineOnly)}
              >
                <Text style={[styles.chipText, onlineOnly && styles.chipTextActive]}>
                  🌐 Solo Online
                </Text>
              </TouchableOpacity>
            </View>

            {/* Min Discount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descuento mínimo</Text>
              <View style={styles.chipRow}>
                {discountOptions.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, minDiscount === d && styles.chipActive]}
                    onPress={() => onMinDiscountChange(minDiscount === d ? undefined : d)}
                  >
                    <Text style={[styles.chipText, minDiscount === d && styles.chipTextActive]}>
                      {d}%+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de tarjeta</Text>
              <View style={styles.chipRow}>
                {cardModes.map((mode) => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[styles.chip, cardMode === mode.value && styles.chipActive]}
                    onPress={() => onCardModeChange(cardMode === mode.value ? undefined : mode.value)}
                  >
                    <Text style={[styles.chipText, cardMode === mode.value && styles.chipTextActive]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Installments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cuotas</Text>
              <TouchableOpacity
                style={[styles.chip, hasInstallments === true && styles.chipActive]}
                onPress={() => onHasInstallmentsChange(hasInstallments === true ? undefined : true)}
              >
                <Text style={[styles.chipText, hasInstallments === true && styles.chipTextActive]}>
                  Con cuotas sin interés
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
              <Text style={styles.clearText}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  chipActive: {
    backgroundColor: colors.blue[50],
    borderColor: colors.blue[500],
  },
  chipText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.blue[700],
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
