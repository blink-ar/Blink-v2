import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  HomeTabs: undefined;
  BenefitDetail: {
    businessId: string;
    benefitIndex: number;
    openDetails?: boolean;
  };
};

export type HomeTabsScreenProps = NativeStackScreenProps<RootStackParamList, 'HomeTabs'>;
export type BenefitDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'BenefitDetail'>;
