import React from 'react';
import { Gift, MapPin, Star } from 'lucide-react';

interface StatsBarProps {
  benefitsCount: number;
  distance?: number;
  rating?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  benefitsCount,
  distance,
  rating,
}) => {
  const stats = [
    {
      icon: Gift,
      label: `${benefitsCount} beneficio${benefitsCount !== 1 ? 's' : ''}`,
      show: true,
    },
    {
      icon: MapPin,
      label: distance ? `${distance.toFixed(1)}km` : 'Distancia no disponible',
      show: distance !== undefined,
    },
    {
      icon: Star,
      label: rating ? `${rating.toFixed(1)}★` : 'Sin calificación',
      show: rating !== undefined,
    },
  ].filter((stat) => stat.show);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <React.Fragment key={index}>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="font-medium">{stat.label}</span>
              </div>
              {index < stats.length - 1 && (
                <div className="hidden sm:block h-4 w-px bg-gray-300" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
