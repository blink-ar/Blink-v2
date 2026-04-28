import React from "react";

interface ComingSoonItem {
  emoji: string;
  label: string;
  category: string;
  teaser: string;
  color: string;
}

const COMING_SOON_ITEMS: ComingSoonItem[] = [
  {
    emoji: "💊",
    label: "Salud y Farmacia",
    category: "salud",
    teaser: "Descuentos en farmacias",
    color: "#10B981",
  },
  {
    emoji: "🏦",
    label: "Macro Beneficios",
    category: "banco",
    teaser: "Nueva red bancaria",
    color: "#6366F1",
  },
  {
    emoji: "📚",
    label: "Educación",
    category: "educacion",
    teaser: "Cursos y capacitaciones",
    color: "#F59E0B",
  },
  {
    emoji: "🖥️",
    label: "Tecnología",
    category: "tech",
    teaser: "Electrónica y gadgets",
    color: "#3B82F6",
  },
];

const ComingSoonCard: React.FC<{ item: ComingSoonItem }> = ({ item }) => (
  <div
    className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex-shrink-0 w-80 relative overflow-hidden select-none"
    aria-label={`Próximamente: ${item.label}`}
  >
    {/* Blur overlay */}
    <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 z-10 rounded-xl" />

    {/* Coming soon badge */}
    <div className="absolute top-3 right-3 z-20 bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
      Pronto
    </div>

    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: item.color }}
        >
          {item.emoji}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-400 text-sm mb-1 truncate">
          {item.label}
        </h3>
        <div className="flex items-center gap-1 text-gray-300 text-xs mb-2">
          <span className="truncate">{item.teaser}</span>
        </div>
        <span className="inline-block bg-gray-100 text-gray-400 text-xs font-medium px-2 py-1 rounded-full">
          Disponible pronto
        </span>
      </div>
    </div>
  </div>
);

const ComingSoonSection: React.FC = () => (
  <div className="mb-2">
    <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
      <h2 className="text-xl font-bold text-gray-900">
        Próximamente
        <span className="ml-2 text-base">🚀</span>
      </h2>
      <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
        Novedades
      </span>
    </div>

    <div
      className="overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory ml-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="flex gap-4 pb-2">
        {COMING_SOON_ITEMS.map((item) => (
          <ComingSoonCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  </div>
);

export default ComingSoonSection;
