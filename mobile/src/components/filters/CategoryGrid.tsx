import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryGridProps {
  categories: readonly CategoryItem[] | CategoryItem[];
  onCategorySelect: (category: CategoryItem) => void;
  selectedCategory: string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onCategorySelect,
  selectedCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: category.color + '20', borderColor: category.color },
              ]}
              onPress={() => onCategorySelect(category as CategoryItem)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: category.color, fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {category.name}
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
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 4,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: '500',
  },
});

export default CategoryGrid;
