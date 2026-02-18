import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trackFilterApply } from '../../analytics/intentTracking';

const CATEGORIES = [
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍕', bg: '#FEF3C7', text: '#92400E' },
  { id: 'moda', label: 'Moda', emoji: '👗', bg: '#FCE7F3', text: '#9D174D' },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎮', bg: '#EDE9FE', text: '#4C1D95' },
  { id: 'deportes', label: 'Deportes', emoji: '⚽', bg: '#D1FAE5', text: '#065F46' },
  { id: 'regalos', label: 'Regalos', emoji: '🎁', bg: '#FEE2E2', text: '#991B1B' },
  { id: 'viajes', label: 'Viajes', emoji: '✈️', bg: '#DBEAFE', text: '#1E40AF' },
  { id: 'automotores', label: 'Automotores', emoji: '🚗', bg: '#F3F4F6', text: '#374151' },
  { id: 'belleza', label: 'Belleza', emoji: '💄', bg: '#FDF2F8', text: '#831843' },
  { id: 'jugueterias', label: 'Jugueterías', emoji: '🧸', bg: '#FEF3C7', text: '#78350F' },
  { id: 'hogar', label: 'Hogar', emoji: '🏠', bg: '#ECFDF5', text: '#064E3B' },
  { id: 'electro', label: 'Electro', emoji: '💻', bg: '#EEF2FF', text: '#312E81' },
  { id: 'shopping', label: 'Supermercado', emoji: '🛒', bg: '#F0FDF4', text: '#14532D' },
  { id: 'otros', label: 'Otros', emoji: '📦', bg: '#F8FAFC', text: '#475569' },
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

  const renderButton = (cat: typeof CATEGORIES[0], keySuffix = '') => (
    <button
      key={`${cat.id}${keySuffix ? `-${keySuffix}` : ''}`}
      onClick={() => handleClick(cat.id)}
      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 whitespace-nowrap"
      style={{
        backgroundColor: cat.bg,
        color: cat.text,
        border: `1px solid ${cat.text}20`,
      }}
    >
      {cat.emoji} {cat.label}
    </button>
  );

  return (
    <section
      className="overflow-hidden py-4"
      style={{
        background: 'linear-gradient(180deg, #F7F6F4 0%, #FFFFFF 50%, #F7F6F4 100%)',
        borderTop: '1px solid #E8E6E1',
        borderBottom: '1px solid #E8E6E1',
      }}
    >
      <div className="flex animate-marquee mb-2.5 gap-2.5 w-[200%]">
        {row1.map((c) => renderButton(c))}
        {row1.map((c) => renderButton(c, 'dup'))}
      </div>
      <div className="flex animate-marquee-reverse gap-2.5 w-[200%]">
        {row2.map((c) => renderButton(c))}
        {row2.map((c) => renderButton(c, 'dup'))}
      </div>
    </section>
  );
};

export default CategoryMarquee;
