import React from "react";
import FeaturedBenefits from "../components/FeaturedBenefits";
import { sampleBenefits } from "../data/sampleBenefits";
import { BankBenefit } from "../types";

const TestFeaturedBenefits: React.FC = () => {
  const handleViewAll = () => {
    console.log("View all benefits clicked");
    alert("Ver todos los beneficios");
  };

  const handleBenefitSelect = (benefit: BankBenefit) => {
    console.log("Benefit selected:", benefit);
    alert(`Beneficio seleccionado: ${benefit.benefit}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Test: Featured Benefits Component
        </h1>

        <div className="max-w-4xl mx-auto">
          <FeaturedBenefits
            benefits={sampleBenefits}
            onViewAll={handleViewAll}
            onBenefitSelect={handleBenefitSelect}
            expirationDate="31 de diciembre"
          />
        </div>

        <div className="mt-12 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Click on any benefit card to see the selection alert</li>
            <li>Click "Ver todos" to see the view all alert</li>
            <li>The cards should have different colors based on the bank</li>
            <li>Discount percentages should appear in badges</li>
            <li>Cards should have hover effects and animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestFeaturedBenefits;
