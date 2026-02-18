import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackFilterApply } from '../../analytics/intentTracking';

const CATEGORIES = [
  { id: 'gastronomia', label: 'GASTRONOMÍA', emoji: '🍕' },
  { id: 'moda', label: 'MODA', emoji: '👗' },
  { id: 'entretenimiento', label: 'ENTRETENIMIENTO', emoji: '🎮' },
  { id: 'deportes', label: 'DEPORTES', emoji: '⚽' },
  { id: 'regalos', label: 'REGALOS', emoji: '🎁' },
  { id: 'viajes', label: 'VIAJES', emoji: '✈️' },
  { id: 'automotores', label: 'AUTOMOTORES', emoji: '🚗' },
  { id: 'belleza', label: 'BELLEZA', emoji: '💄' },
  { id: 'jugueterias', label: 'JUGUETERÍAS', emoji: '🧸' },
  { id: 'hogar', label: 'HOGAR', emoji: '🏠' },
  { id: 'electro', label: 'ELECTRO', emoji: '💻' },
  { id: 'shopping', label: 'SUPERMERCADO', emoji: '🛒' },
  { id: 'otros', label: 'OTROS', emoji: '📦' },
];

const row1 = CATEGORIES.slice(0, 7);
const row2 = CATEGORIES.slice(7);

const CategoryMarquee: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = (categoryId: string) => {
    trackFilterApply({
      source: 'home_category_marquee',
      filterType: 'category',
      filterValue: categoryId,
      activeFilterCount: 1,
    });
    navigate(`/search?category=${categoryId}`);
  };

  const renderButton = (
    cat: typeof CATEGORIES[0],
    variant: 'light' | 'dark',
    keySuffix = '',
  ) => (
    <button
      key={`${cat.id}${keySuffix ? `-${keySuffix}` : ''}`}
      onClick={() => handleClick(cat.id)}
      className={`flex-shrink-0 px-6 py-2 rounded-full border font-bold font-mono hover:bg-primary hover:text-blink-ink hover:border-transparent transition-colors ${
        variant === 'dark'
          ? 'border-blink-surface bg-blink-ink text-white'
          : 'border-blink-surface bg-blink-surface text-blink-ink'
      }`}
    >
      {cat.emoji} {cat.label}
    </button>
  );

  return (
    <section className="overflow-hidden py-4 border-y-2 border-blink-ink bg-blink-ink">
      <div className="flex animate-marquee mb-3 gap-3 w-[200%]">
        {row1.map((c) => renderButton(c, 'dark'))}
        {row1.map((c) => renderButton(c, 'dark', 'dup'))}
      </div>
      <div className="flex animate-marquee-reverse gap-3 w-[200%]">
        {row2.map((c) => renderButton(c, 'light'))}
        {row2.map((c) => renderButton(c, 'light', 'dup'))}
      </div>
    </section>
  );
};

export default CategoryMarquee;
