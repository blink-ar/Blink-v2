/**
 * RawBenefitCard Component
 *
 * Displays a benefit using the exact raw format from the API (data.benefits)
 * No transformation applied - works directly with MongoDB structure
 */

import React from "react";
import { RawMongoBenefit } from "../types/mongodb";

interface RawBenefitCardProps {
  benefit: RawMongoBenefit;
  className?: string;
}

export const RawBenefitCard: React.FC<RawBenefitCardProps> = ({
  benefit,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {benefit.merchant?.name || "Unknown Merchant"}
          </h3>
          <p className="text-sm text-gray-600">{benefit.bank}</p>
        </div>
        {benefit.discountPercentage && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {benefit.discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Benefit Title */}
      <h4 className="text-md font-medium text-gray-800 mb-2">
        {benefit.benefitTitle}
      </h4>

      {/* Description */}
      {benefit.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {benefit.description}
        </p>
      )}

      {/* Categories */}
      {benefit.categories && benefit.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {benefit.categories.map((category, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Card Types */}
      {benefit.cardTypes && benefit.cardTypes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Card Types:</p>
          <div className="flex flex-wrap gap-1">
            {benefit.cardTypes.map((cardType, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                {cardType.name} ({cardType.mode})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location & Online */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>{benefit.location || "Location not specified"}</span>
        {benefit.online && (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
            Online
          </span>
        )}
      </div>

      {/* Available Days */}
      {benefit.availableDays && benefit.availableDays.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Available Days:</p>
          <p className="text-sm text-gray-700">
            {benefit.availableDays.join(", ")}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">Network: {benefit.network}</div>
        {benefit.validUntil && (
          <div className="text-xs text-gray-500">
            Valid until: {benefit.validUntil}
          </div>
        )}
      </div>

      {/* Raw ID for debugging */}
      <div className="mt-2 text-xs text-gray-400 font-mono">
        ID: {benefit._id?.$oid || "No ID"}
      </div>
    </div>
  );
};

export default RawBenefitCard;
