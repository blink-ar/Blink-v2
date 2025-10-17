import { RawMongoBenefit } from "../types/mongodb";

export const sampleRawBenefits: RawMongoBenefit[] = [
    {
        _id: { $oid: "507f1f77bcf86cd799439011" },
        merchant: {
            name: "McDonald's",
            type: "restaurant"
        },
        bank: "Santander",
        network: "Visa",
        cardTypes: [
            {
                name: "Santander Select",
                category: "premium",
                mode: "credit"
            }
        ],
        benefitTitle: "30% de descuento en toda la carta",
        description: "Obtén un 30% de descuento en todos los productos de McDonald's presentando tu tarjeta Santander Select.",
        categories: ["gastronomia", "comida rapida"],
        location: "Nacional",
        online: false,
        availableDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
        discountPercentage: 30,
        link: "https://www.mcdonalds.cl",
        termsAndConditions: "Válido en locales participantes. No acumulable con otras promociones.",
        validUntil: "2024-12-31",
        originalId: { $oid: "507f1f77bcf86cd799439012" },
        sourceCollection: "benefits_santander",
        processedAt: { $date: "2024-01-15T10:30:00.000Z" },
        processingStatus: "active"
    },
    {
        _id: { $oid: "507f1f77bcf86cd799439013" },
        merchant: {
            name: "Starbucks",
            type: "cafe"
        },
        bank: "Banco de Chile",
        network: "Mastercard",
        cardTypes: [
            {
                name: "Visa Signature",
                category: "premium",
                mode: "credit"
            }
        ],
        benefitTitle: "2x1 en bebidas grandes",
        description: "Compra una bebida grande y llévate otra gratis todos los martes con tu tarjeta Banco de Chile.",
        categories: ["gastronomia", "cafe"],
        location: "Nacional",
        online: false,
        availableDays: ["martes"],
        discountPercentage: 50,
        link: "https://www.starbucks.cl",
        termsAndConditions: "Válido solo los martes. Aplica para bebidas de igual o menor valor.",
        validUntil: "2024-12-31",
        originalId: { $oid: "507f1f77bcf86cd799439014" },
        sourceCollection: "benefits_banco_chile",
        processedAt: { $date: "2024-01-15T10:30:00.000Z" },
        processingStatus: "active"
    },
    {
        _id: { $oid: "507f1f77bcf86cd799439015" },
        merchant: {
            name: "Falabella",
            type: "retail"
        },
        bank: "BCI",
        network: "Mastercard",
        cardTypes: [
            {
                name: "Mastercard Black",
                category: "premium",
                mode: "credit"
            }
        ],
        benefitTitle: "15% de descuento en moda",
        description: "Descuento del 15% en toda la sección de moda y accesorios con tu tarjeta BCI Mastercard Black.",
        categories: ["moda", "retail"],
        location: "Nacional",
        online: true,
        availableDays: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
        discountPercentage: 15,
        link: "https://www.falabella.com",
        termsAndConditions: "Válido en tiendas físicas y online. Excluye marcas premium.",
        validUntil: "2024-12-31",
        originalId: { $oid: "507f1f77bcf86cd799439016" },
        sourceCollection: "benefits_bci",
        processedAt: { $date: "2024-01-15T10:30:00.000Z" },
        processingStatus: "active"
    }
];

export default sampleRawBenefits;