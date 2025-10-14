import React from "react";
import { Search } from "lucide-react";
import { TouchInput } from "./ui";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar descuento...",
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <TouchInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        icon={<Search className="h-5 w-5" />}
        className="bg-white/90 backdrop-blur-sm border-gray-200 rounded-2xl shadow-lg focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        touchOptimized={true}
      />
    </div>
  );
};
