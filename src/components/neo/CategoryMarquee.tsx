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

// px per animation frame — relaxed pace (~30px/s at 60fps)
const SPEED = 0.5;

interface MarqueeRowProps {
  items: typeof CATEGORIES;
  /** true = row scrolls right-to-left, false = left-to-right */
  reverse?: boolean;
  className?: string;
  onCategoryClick: (id: string) => void;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ items, reverse = false, className = '', onCategoryClick }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const isPausedRef = useRef(false);
  const initDoneRef = useRef(false);
  // Track drag to suppress click after swipe
  const dragRef = useRef({ startX: 0, startPos: 0, hasMoved: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;

    const tick = () => {
      // offsetWidth of inline-flex gives full content width once layout is done
      const totalW = track.offsetWidth;
      const halfW = totalW / 2;

      if (halfW > 0) {
        // First valid frame: initialize reverse row at midpoint
        if (!initDoneRef.current) {
          initDoneRef.current = true;
          if (reverse) posRef.current = -halfW;
        }

        if (!isPausedRef.current) {
          // reverse=false → scroll left (pos decrements toward -halfW)
          // reverse=true  → scroll right (pos increments toward 0)
          posRef.current += reverse ? SPEED : -SPEED;
        }

        // Seamless loop: keep pos in the range [-halfW, 0)
        if (posRef.current < -halfW) posRef.current += halfW;
        if (posRef.current >= 0) posRef.current -= halfW;

        track.style.transform = `translateX(${posRef.current}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reverse]);

  const handleTouchStart = (e: React.TouchEvent) => {
    isPausedRef.current = true;
    dragRef.current = { startX: e.touches[0].clientX, startPos: posRef.current, hasMoved: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - dragRef.current.startX;
    if (Math.abs(dx) > 5) dragRef.current.hasMoved = true;
    const track = trackRef.current;
    if (!track) return;
    const halfW = track.offsetWidth / 2;
    let p = dragRef.current.startPos + dx;
    if (halfW > 0) {
      while (p < -halfW * 2) p += halfW;
      while (p >= 0) p -= halfW;
      if (p < -halfW) p += halfW;
    }
    posRef.current = p;
  };

  const handleTouchEnd = () => {
    isPausedRef.current = false;
  };

  const renderButtons = (suffix = '') =>
    items.map((cat) => (
      <button
        key={`${cat.id}${suffix}`}
        onPointerDown={() => { dragRef.current.hasMoved = false; }}
        onClick={() => {
          if (dragRef.current.hasMoved) return;
          onCategoryClick(cat.id);
        }}
        className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95"
        style={{
          backgroundColor: cat.bg,
          color: cat.text,
          border: `1px solid ${cat.text}20`,
        }}
      >
        {cat.emoji} {cat.label}
      </button>
    ));

  return (
    <div
      className={`overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* inline-flex so offsetWidth = full content width (used for seamless loop) */}
      <div ref={trackRef} className="inline-flex gap-2.5 py-1">
        {renderButtons()}
        {renderButtons('-dup')}
      </div>
    </div>
  );
};

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

  return (
    <section
      className="overflow-hidden py-4"
      style={{
        background: 'linear-gradient(180deg, #F7F6F4 0%, #FFFFFF 50%, #F7F6F4 100%)',
      }}
    >
      <MarqueeRow items={row1} reverse={false} className="mb-2.5" onCategoryClick={handleClick} />
      <MarqueeRow items={row2} reverse={true} onCategoryClick={handleClick} />
    </section>
  );
};

export default CategoryMarquee;
