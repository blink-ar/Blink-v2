export interface BankBenefit {
  bankName: string;
  cardName: string;
  benefit: string;
  rewardRate: string;
  color: string;
  icon: string;
  // Extended fields from beneficios array
  tipo?: string;
  cuando?: string;
  valor?: string;
  tope?: string;
  claseDeBeneficio?: string;
  condicion?: string;
  requisitos?: string[];
  usos?: string[];
  textoAplicacion?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  location: string;
  image: string;
  benefits: BankBenefit[];
  // Enhanced fields for new functionality
  isFavorite?: boolean;
  lastUpdated?: number;
  imageLoaded?: boolean;
}

export type Category =
  | 'all'
  | 'gastronomia'
  | 'moda'
  | 'entretenimiento'
  | 'otros'
  | 'deportes'
  | 'regalos'
  | 'viajes'
  | 'automotores'
  | 'belleza'
  | 'jugueterias'
  | 'hogar'
  | 'electro'
  | 'shopping';