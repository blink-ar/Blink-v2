import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { X, ExternalLink, CreditCard, Calendar, Tag, FileText } from 'lucide-react-native';
import { BankBenefit } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { GradientBadge } from './ui/GradientBadge';
import { colors, borderRadius, shadows } from '../constants/theme';

interface BenefitDetailModalProps {
  benefit: BankBenefit | null;
  rawBenefit?: RawMongoBenefit | null;
  isOpen: boolean;
  onClose: () => void;
}

const BenefitDetailModal: React.FC<BenefitDetailModalProps> = ({
  benefit,
  rawBenefit,
  isOpen,
  onClose,
}) => {
  if (!benefit) return null;

  const discountMatch = benefit.rewardRate.match(/(\d+)%/);
  const percentage = discountMatch ? discountMatch[1] : benefit.rewardRate;

  const description = benefit.description || rawBenefit?.description || benefit.benefit;
  const termsAndConditions = benefit.condicion || rawBenefit?.termsAndConditions;
  const link = benefit.textoAplicacion || rawBenefit?.link;
  const availableDays = rawBenefit?.availableDays || [];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, shadows.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <GradientBadge
                percentage={percentage}
                installments={benefit.installments}
                benefitTitle={benefit.benefit}
                size="lg"
              />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Bank & Card Info */}
            <View style={styles.bankRow}>
              <CreditCard size={16} color={colors.primary[600]} />
              <Text style={styles.bankText}>{benefit.bankName}</Text>
              <Text style={styles.cardText}>{benefit.cardName}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{benefit.benefit}</Text>

            {/* Description */}
            {description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.sectionText}>{description}</Text>
              </View>
            )}

            {/* Available Days */}
            {availableDays.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={14} color={colors.gray[600]} />
                  <Text style={styles.sectionTitle}>Días disponibles</Text>
                </View>
                <View style={styles.chipRow}>
                  {availableDays.map((day) => (
                    <View key={day} style={styles.dayChip}>
                      <Text style={styles.dayChipText}>{day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Installments */}
            {benefit.installments != null && benefit.installments > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Tag size={14} color={colors.gray[600]} />
                  <Text style={styles.sectionTitle}>Cuotas</Text>
                </View>
                <Text style={styles.sectionText}>
                  Hasta {benefit.installments} cuotas sin interés
                </Text>
              </View>
            )}

            {/* Terms & Conditions */}
            {termsAndConditions && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FileText size={14} color={colors.gray[600]} />
                  <Text style={styles.sectionTitle}>Términos y condiciones</Text>
                </View>
                <Text style={styles.termsText}>{termsAndConditions}</Text>
              </View>
            )}

            {/* Link */}
            {link && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(link.startsWith('http') ? link : `https://${link}`)}
              >
                <ExternalLink size={16} color={colors.white} />
                <Text style={styles.linkText}>Ver oferta</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerLeft: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bankText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  cardText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  sectionText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayChipText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});

export default BenefitDetailModal;
