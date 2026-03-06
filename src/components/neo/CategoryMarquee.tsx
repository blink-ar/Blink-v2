import React, { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackFilterApply } from '../../analytics/intentTracking';

const CATEGORIES = [
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍕', bg: '#EEF2FF', text: '#4338CA' },
  { id: 'moda', label: 'Moda', emoji: '👗', bg: '#FCE7F3', text: '#9D174D' },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎮', bg: '#EDE9FE', text: '#4C1D95' },
  { id: 'deportes', label: 'Deportes', emoji: '⚽', bg: '#D1FAE5', text: '#065F46' },
  { id: 'regalos', label: 'Regalos', emoji: '🎁', bg: '#FEE2E2', text: '#991B1B' },
  { id: 'viajes', label: 'Viajes', emoji: '✈️', bg: '#DBEAFE', text: '#1E40AF' },
  { id: 'automotores', label: 'Automotores', emoji: '🚗', bg: '#F3F4F6', text: '#374151' },
  { id: 'belleza', label: 'Belleza', emoji: '💄', bg: '#FDF2F8', text: '#831843' },
  { id: 'jugueterias', label: 'Jugueterías', emoji: '🧸', bg: '#EEF2FF', text: '#78350F' },
  { id: 'hogar', label: 'Hogar', emoji: '🏠', bg: '#ECFDF5', text: '#064E3B' },
  { id: 'electro', label: 'Electro', emoji: '💻', bg: '#EEF2FF', text: '#312E81' },
  { id: 'shopping', label: 'Supermercado', emoji: '🛒', bg: '#F0FDF4', text: '#14532D' },
  { id: 'otros', label: 'Otros', emoji: '📦', bg: '#F8FAFC', text: '#475569' },
];

const row1 = CATEGORIES.slice(0, 7);
const row2 = CATEGORIES.slice(7);

const SPEED = 0.8; // px per frame

function useScrollableMarquee(reverse = false) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const animate = useCallback(() => {
    const el = containerRef.current;
    if (el && !isDragging.current) {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (reverse) {
          el.scrollLeft -= SPEED;
          if (el.scrollLeft <= 0) el.scrollLeft = half;
        } else {
          el.scrollLeft += SPEED;
          if (el.scrollLeft >= half) el.scrollLeft = 0;
        }
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [reverse]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = containerRef.current?.scrollLeft ?? 0;
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const walk = startX.current - e.clientX;
    if (Math.abs(walk) > 4) hasDragged.current = true;
    el.scrollLeft = startScrollLeft.current + walk;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Suppress click on buttons when the user actually dragged
  const onClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDragged.current = false;
    }
  };

  return {
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: onPointerUp,
      onClickCapture,
    },
  };
}

const CategoryMarquee: React.FC = () => {
  const navigate = useNavigate();
  const row1Marquee = useScrollableMarquee(false);
  const row2Marquee = useScrollableMarquee(true);

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
      className="py-4"
      style={{
        background: 'linear-gradient(180deg, #F7F6F4 0%, #FFFFFF 50%, #F7F6F4 100%)',
        borderTop: '1px solid #E8E6E1',
        borderBottom: '1px solid #E8E6E1',
      }}
    >
      <div className="overflow-hidden mb-2.5">
        <div
          ref={row1Marquee.containerRef}
          {...row1Marquee.handlers}
          className="flex gap-2.5 overflow-x-scroll scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        >
          {row1.map((c) => renderButton(c))}
          {row1.map((c) => renderButton(c, 'dup'))}
        </div>
      </div>
      <div className="overflow-hidden">
        <div
          ref={row2Marquee.containerRef}
          {...row2Marquee.handlers}
          className="flex gap-2.5 overflow-x-scroll scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        >
          {row2.map((c) => renderButton(c))}
          {row2.map((c) => renderButton(c, 'dup'))}
        </div>
      </div>
    </section>
  );
};

export default CategoryMarquee;
