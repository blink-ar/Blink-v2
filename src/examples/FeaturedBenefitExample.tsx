import React from "react";
import FeaturedBenefit from "../components/FeaturedBenefit";
import { BankBenefit } from "../types";

const FeaturedBenefitExample: React.FC = () => {
  // Example benefit data
  const exampleBenefit: BankBenefit = {
    bankName: "Santander",
    cardName: "Tarjeta Santander Select",
    benefit: "30% de descuento en McDonald's",
    rewardRate: "Hasta $50.000",
    color: "#EC0000", // Santander red
    icon: "https://via.placeholder.com/40x40/EC0000/FFFFFF?text=S",
    tipo: "Descuento",
    cuando: "Lunes a viernes",
    valor: "30% de descuento",
    tope: "$50.000 por mes",
    claseDeBeneficio: "Gastronomía",
    condicion: "Válido en locales participantes",
    requisitos: ["Tarjeta activa", "Compra mínima $20.000"],
    usos: ["Presencial", "Delivery"],
    textoAplicacion: "Presenta tu tarjeta al momento del pago",
  };

  const handleBenefitClick = (benefit: BankBenefit) => {
    console.log("Clicked benefit:", benefit.benefit);
    // Here you would navigate to the benefit detail page
    alert(`Ver detalles de: ${benefit.benefit}`);
  };

  return (
    <div className="featured-benefit-examples">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Ejemplos de Beneficios Destacados
        </h1>

        <div className="space-y-6">
          {/* Example 1: McDonald's discount */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Descuento en McDonald's
            </h2>
            <FeaturedBenefit
              benefit={exampleBenefit}
              businessName="McDonald's"
              onSelect={() => handleBenefitClick(exampleBenefit)}
            />
          </div>

          {/* Grid example */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Vista en Grilla (Responsive)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeaturedBenefit
                benefit={exampleBenefit}
                businessName="McDonald's"
                onSelect={() => handleBenefitClick(exampleBenefit)}
              />
            </div>
          </div>
        </div>

        {/* Usage instructions */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Cómo usar el componente FeaturedBenefit
          </h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
            {`import FeaturedBenefit from "../components/FeaturedBenefit";

<FeaturedBenefit
  benefit={benefitData}
  businessName="McDonald's"
  onSelect={() => handleBenefitClick(benefitData)}
  className="custom-class" // opcional
/>`}
          </pre>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Props:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <code>benefit</code>: Objeto BankBenefit con la información del
                beneficio
              </li>
              <li>
                <code>businessName</code>: Nombre del negocio (opcional)
              </li>
              <li>
                <code>onSelect</code>: Función que se ejecuta al hacer clic en
                la tarjeta
              </li>
              <li>
                <code>className</code>: Clases CSS adicionales (opcional)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBenefitExample;
