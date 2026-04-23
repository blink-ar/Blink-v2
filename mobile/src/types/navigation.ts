import type { Business } from './index';

// Root tab param list
export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: { q?: string; bank?: string; category?: string } | undefined;
  MapTab: { business?: string } | undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

// Home stack
export type HomeStackParamList = {
  Home: undefined;
  BusinessDetail: { businessId: string; business?: Business };
  BenefitDetail: { businessId: string; benefitIndex: number; business?: Business };
};

// Search stack
export type SearchStackParamList = {
  Search: { q?: string; bank?: string; category?: string } | undefined;
  BusinessDetail: { businessId: string; business?: Business };
  BenefitDetail: { businessId: string; benefitIndex: number; business?: Business };
};

// Map stack
export type MapStackParamList = {
  Map: { business?: string } | undefined;
  BusinessDetail: { businessId: string; business?: Business };
  BenefitDetail: { businessId: string; benefitIndex: number; business?: Business };
};

// Saved stack
export type SavedStackParamList = {
  Saved: undefined;
  BusinessDetail: { businessId: string; business?: Business };
  BenefitDetail: { businessId: string; benefitIndex: number; business?: Business };
};

// Profile stack
export type ProfileStackParamList = {
  Profile: undefined;
};
