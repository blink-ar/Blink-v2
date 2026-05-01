import React, { useRef, useEffect } from 'react';
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

const SCROLL_SPEED = 0.45; // px per animation frame — slow and relaxed

function useAutoScrollRow(reverse = false) {
  const ref = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // For the reverse row, start at the midpoint so it scrolls "backwards" into view
    const initScroll = () => {
      if (reverse) {
        el.scrollLeft = el.scrollWidth / 2;
      }
    };

    // Small delay to let layout paint before reading scrollWidth
    const initTimer = setTimeout(initScroll, 50);

    let rafId: number;

    const tick = () => {
      if (!isPaused.current) {
        if (reverse) {
          el.scrollLeft -= SCROLL_SPEED;
        } else {
          el.scrollLeft += SCROLL_SPEED;
        }
      }

      // Seamless loop: when reaching midpoint, jump back to start (or vice-versa)
      if (!reverse && el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft -= el.scrollWidth / 2;
      } else if (reverse && el.scrollLeft <= 0) {
        el.scrollLeft += el.scrollWidth / 2;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const pause = () => { isPaused.current = true; };
    const resume = () => { isPaused.current = false; };

    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume, { passive: true });
    el.addEventListener('touchcancel', resume, { passive: true });
    el.addEventListener('mousedown', pause);
    el.addEventListener('mouseup', resume);
    el.addEventListener('mouseleave', resume);

    return () => {
      clearTimeout(initTimer);
      cancelAnimationFrame(rafId);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
      el.removeEventListener('touchcancel', resume);
      el.removeEventListener('mousedown', pause);
      el.removeEventListener('mouseup', resume);
      el.removeEventListener('mouseleave', resume);
    };
  }, [reverse]);

  return ref;
}

const CategoryMarquee: React.FC = () => {
  const navigate = useNavigate();
  const row1Ref = useAutoScrollRow(false);
  const row2Ref = useAutoScrollRow(true);

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
      }}
    >
      {/* Row 1 — scrolls forward, user can swipe to browse */}
      <div
        ref={row1Ref}
        className="flex overflow-x-auto no-scrollbar mb-2.5 gap-2.5 py-1 cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {row1.map((c) => renderButton(c))}
        {row1.map((c) => renderButton(c, 'dup'))}
      </div>

      {/* Row 2 — scrolls in reverse, user can swipe to browse */}
      <div
        ref={row2Ref}
        className="flex overflow-x-auto no-scrollbar gap-2.5 py-1 cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {row2.map((c) => renderButton(c))}
        {row2.map((c) => renderButton(c, 'dup'))}
      </div>
    </section>
  );
};

export default CategoryMarquee;
