import { Business, Category } from '../types';

export interface CategoryConfig {
    value: Category;
    label: string;
    patterns: string[];
    matchType: 'includes' | 'exact' | 'startsWith';
}

export interface CategoryFilterService {
    filterBusinessesByCategory(businesses: Business[], category: Category): Business[];
    getCategoryConfig(): CategoryConfig[];
    addCategoryConfig(config: CategoryConfig): void;
}

// Default category configuration based on current Home.tsx logic
const defaultCategoryConfigs: CategoryConfig[] = [
    {
        value: 'all',
        label: 'Todos',
        patterns: [],
        matchType: 'exact'
    },
    {
        value: 'gastronomia',
        label: 'Gastronomía',
        patterns: ['gastronom'],
        matchType: 'includes'
    },
    {
        value: 'moda',
        label: 'Moda',
        patterns: ['moda'],
        matchType: 'includes'
    },
    {
        value: 'entretenimiento',
        label: 'Entretenimiento',
        patterns: ['entretenimiento'],
        matchType: 'includes'
    },
    {
        value: 'otros',
        label: 'Otros',
        patterns: ['otros'],
        matchType: 'includes'
    },
    {
        value: 'deportes',
        label: 'Deportes',
        patterns: ['deporte'],
        matchType: 'includes'
    },
    {
        value: 'regalos',
        label: 'Regalos',
        patterns: ['regalo'],
        matchType: 'includes'
    },
    {
        value: 'viajes',
        label: 'Viajes',
        patterns: ['viaje'],
        matchType: 'includes'
    },
    {
        value: 'automotores',
        label: 'Automotores',
        patterns: ['automotor'],
        matchType: 'includes'
    },
    {
        value: 'belleza',
        label: 'Belleza',
        patterns: ['belleza'],
        matchType: 'includes'
    },
    {
        value: 'jugueterias',
        label: 'Jugueterías',
        patterns: ['jugueter'],
        matchType: 'includes'
    },
    {
        value: 'hogar',
        label: 'Hogar y Deco',
        patterns: ['hogar', 'deco'],
        matchType: 'includes'
    },
    {
        value: 'electro',
        label: 'Electro y Tecnología',
        patterns: ['electro', 'tecnolog'],
        matchType: 'includes'
    },
    {
        value: 'shopping',
        label: 'Shopping',
        patterns: ['shopping'],
        matchType: 'includes'
    }
];

export class CategoryFilterServiceImpl implements CategoryFilterService {
    private categoryConfigs: CategoryConfig[];

    constructor(configs: CategoryConfig[] = defaultCategoryConfigs) {
        this.categoryConfigs = [...configs];
    }

    filterBusinessesByCategory(businesses: Business[], category: Category): Business[] {
        if (category === 'all') {
            return businesses;
        }

        const config = this.categoryConfigs.find(c => c.value === category);
        if (!config) {
            // Fallback to exact string matching if no configuration found
            return businesses.filter(business =>
                typeof business.category === 'string' &&
                business.category.toLowerCase() === category.toLowerCase()
            );
        }

        return businesses.filter(business => {
            if (typeof business.category !== 'string') {
                return false;
            }

            const businessCategory = business.category.toLowerCase();

            return config.patterns.some(pattern => {
                const lowerPattern = pattern.toLowerCase();

                switch (config.matchType) {
                    case 'exact':
                        return businessCategory === lowerPattern;
                    case 'startsWith':
                        return businessCategory.startsWith(lowerPattern);
                    case 'includes':
                    default:
                        return businessCategory.includes(lowerPattern);
                }
            });
        });
    }

    getCategoryConfig(): CategoryConfig[] {
        return [...this.categoryConfigs];
    }

    addCategoryConfig(config: CategoryConfig): void {
        const existingIndex = this.categoryConfigs.findIndex(c => c.value === config.value);
        if (existingIndex >= 0) {
            this.categoryConfigs[existingIndex] = config;
        } else {
            this.categoryConfigs.push(config);
        }
    }
}

// Export singleton instance
export const categoryFilterService = new CategoryFilterServiceImpl();