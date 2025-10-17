import { BankBenefit } from "../types";

export const sampleBenefits: BankBenefit[] = [
    {
        bankName: "Santander",
        cardName: "Tarjeta Santander Select",
        benefit: "30% de descuento en McDonald's",
        rewardRate: "Hasta $50.000",
        color: "#EC0000",
        icon: "https://via.placeholder.com/40x40/EC0000/FFFFFF?text=S",
        tipo: "Descuento",
        cuando: "Lunes a viernes",
        valor: "30% de descuento",
        tope: "$50.000 por mes",
        claseDeBeneficio: "Gastronomía",
        condicion: "Válido en locales participantes",
        requisitos: ["Tarjeta activa", "Compra mínima $20.000"],
        usos: ["Presencial", "Delivery"],
        textoAplicacion: "Presenta tu tarjeta al momento del pago"
    }
];

export default sampleBenefits;