import React from "react";
import { RawBenefit } from "../types/benefit";

interface RawBenefitCardProps {
  benefit: RawBenefit;
}

/**
 * Simple component that displays your raw MongoDB benefit data
 * No transformation, just your data exactly as it is
 */
export const RawBenefitCard: React.FC<RawBenefitCardProps> = ({ benefit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            🏪 {benefit.merchant.name}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {benefit.merchant.type}
          </p>
        </div>
        <div className="text-right">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            🏦 {benefit.bank}
          </span>
          <p className="text-xs text-gray-500 mt-1">{benefit.network}</p>
        </div>
      </div>

      {/* Benefit Title */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {benefit.benefitTitle}
        </h4>
        <p className="text-gray-600">{benefit.description}</p>
      </div>

      {/* Discount */}
      <div className="flex items-center mb-4">
        <span className="bg-green-100 text-green-800 text-lg font-bold px-3 py-1 rounded-full">
          {benefit.discountPercentage}% OFF
        </span>
        <span className="ml-3 text-sm text-gray-500">
          {benefit.online ? "🌐 Online + 🏪 Presencial" : "🏪 Solo presencial"}
        </span>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {benefit.categories.map((category, index) => (
            <span
              key={index}
              className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded capitalize"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      {/* Card Types */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Tarjetas válidas:
        </p>
        <div className="flex flex-wrap gap-2">
          {benefit.cardTypes.map((card, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border capitalize"
            >
              {card.name} ({card.mode})
            </span>
          ))}
        </div>
      </div>

      {/* Location and Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">📍 Ubicación:</p>
          <p className="text-sm text-gray-600">{benefit.location}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            📅 Días disponibles:
          </p>
          <p className="text-sm text-gray-600">
            {benefit.availableDays.join(", ")}
          </p>
        </div>
      </div>

      {/* Link */}
      {benefit.link && (
        <div className="mb-4">
          <a
            href={
              benefit.link.startsWith("http")
                ? benefit.link
                : `https://${benefit.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            🔗 Visitar sitio web
          </a>
        </div>
      )}

      {/* Valid Until */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          ⏰ Válido hasta:{" "}
          <span className="font-medium">{benefit.validUntil}</span>
        </p>
      </div>

      {/* Terms and Conditions */}
      <details className="mb-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
          📋 Términos y condiciones
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
          {benefit.termsAndConditions}
        </div>
      </details>

      {/* Raw Data Info */}
      <div className="border-t pt-3 text-xs text-gray-400">
        <p>ID: {benefit._id.$oid}</p>
        <p>Fuente: {benefit.sourceCollection}</p>
        <p>Estado: {benefit.processingStatus}</p>
      </div>
    </div>
  );
};
