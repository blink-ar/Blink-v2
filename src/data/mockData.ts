import { Business } from "../types";

/**
 * Updated mock businesses with consistent data structure
 * Generated using the same transformation logic as API responses
 */
export const mockBusinesses: Business[] = [
  {
    id: "starbucks-coffee",
    name: "Starbucks Coffee",
    category: "gastronomia",
    description: "Global coffeehouse chain known for premium coffee and cozy atmosphere",
    rating: 4.5,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Chase",
        cardName: "Premium Card",
        benefit: "Earn 3x points on dining",
        rewardRate: "3x points",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Cashback",
        cuando: "Válido hasta 31/12/2024",
        valor: "3%",
        tope: "$500 por mes",
        claseDeBeneficio: "Gastronomía",
        condicion: "Mínimo de compra $25",
        requisitos: [
          "Tarjeta activa y al día",
          "Compra mínima de $25",
          "Válido solo en restaurantes participantes"
        ],
        usos: [
          "Restaurantes",
          "Cafeterías",
          "Delivery de comida"
        ],
        textoAplicacion: "Beneficio aplicado automáticamente al momento de la compra. Puntos acreditados en el próximo resumen."
      },
      {
        bankName: "Capital One",
        cardName: "Rewards Card",
        benefit: "Earn 4% cash back on dining",
        rewardRate: "4% cash back",
        color: "bg-red-500",
        icon: "CreditCard",
        tipo: "Descuento",
        cuando: "Permanente",
        valor: "4%",
        tope: "Sin límite",
        claseDeBeneficio: "Gastronomía",
        condicion: "Sin condiciones especiales",
        requisitos: [
          "Tarjeta Capital One activa"
        ],
        usos: [
          "Todos los restaurantes",
          "Fast food",
          "Bares y pubs"
        ],
        textoAplicacion: "Cashback acreditado mensualmente en tu estado de cuenta."
      },
      {
        bankName: "American Express",
        cardName: "Credit Card",
        benefit: "Earn 4x points at restaurants",
        rewardRate: "4x points",
        color: "bg-yellow-500",
        icon: "CreditCard",
        tipo: "Puntos",
        cuando: "01/01/2024 - 31/12/2024",
        valor: "4 puntos por cada $1",
        tope: "10,000 puntos por mes",
        claseDeBeneficio: "Gastronomía Premium",
        condicion: "Aplicable solo en restaurantes de categoría premium",
        requisitos: [
          "Membresía American Express activa",
          "Gasto mínimo mensual de $200"
        ],
        usos: [
          "Restaurantes fine dining",
          "Hoteles con restaurante",
          "Catering de eventos"
        ]
      },
    ],
    lastUpdated: Date.now() - 1800000, // 30 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "shell-gas-station",
    name: "Shell Gas Station",
    category: "automotores",
    description: "Leading fuel retailer with convenient locations nationwide",
    rating: 4.2,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/33488/gasoline-gas-station-refuel-gas.jpg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Chase",
        cardName: "Premium Card",
        benefit: "Rotating 5% categories include gas",
        rewardRate: "5% quarterly",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Cashback Rotativo",
        cuando: "Q1 2024: Enero - Marzo",
        valor: "5%",
        tope: "$1,500 en compras por trimestre",
        claseDeBeneficio: "Combustible",
        condicion: "Activación requerida cada trimestre",
        requisitos: [
          "Activar categoría antes del primer uso",
          "Máximo $1,500 en compras elegibles por trimestre"
        ],
        usos: [
          "Estaciones de servicio Shell",
          "Estaciones de servicio Exxon",
          "Otras estaciones participantes"
        ],
        textoAplicacion: "Activa tu categoría trimestral en la app Chase para comenzar a ganar 5% cashback."
      },
      {
        bankName: "Citi",
        cardName: "Business Card",
        benefit: "Earn 5% on gas purchases",
        rewardRate: "5% cash back",
        color: "bg-indigo-500",
        icon: "CreditCard",
        tipo: "Cashback Empresarial",
        valor: "5%",
        tope: "$25,000 anuales",
        claseDeBeneficio: "Combustible Empresarial",
        requisitos: [
          "Cuenta empresarial Citi activa",
          "Facturación mínima mensual de $1,000"
        ],
        usos: [
          "Todas las estaciones de servicio",
          "Compras de combustible al por mayor"
        ]
      },
    ],
    lastUpdated: Date.now() - 2400000, // 40 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "target",
    name: "Target",
    category: "shopping",
    description: "Popular retail chain offering everything from groceries to home goods",
    rating: 4.3,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Target",
        cardName: "Rewards Card",
        benefit: "5% off every purchase",
        rewardRate: "5% discount",
        color: "bg-red-600",
        icon: "CreditCard",
        tipo: "Descuento Directo",
        cuando: "Permanente",
        valor: "5%",
        claseDeBeneficio: "Retail",
        condicion: "Válido en todas las compras en Target",
        requisitos: [
          "Tarjeta Target REDcard activa"
        ],
        usos: [
          "Tiendas Target físicas",
          "Target.com",
          "App móvil de Target"
        ],
        textoAplicacion: "Descuento aplicado automáticamente en caja. No requiere cupones ni códigos."
      },
      {
        bankName: "Chase",
        cardName: "Premium Card",
        benefit: "Earn 1.5% on all purchases",
        rewardRate: "1.5% cash back",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Cashback Universal",
        cuando: "Sin fecha de vencimiento",
        valor: "1.5%",
        claseDeBeneficio: "Compras Generales",
        condicion: "Aplicable a todas las compras sin restricciones",
        requisitos: [],
        usos: [
          "Cualquier comercio",
          "Compras online",
          "Servicios"
        ],
        textoAplicacion: "Cashback acreditado automáticamente cada mes en tu estado de cuenta."
      },
    ],
    lastUpdated: Date.now() - 900000, // 15 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "whole-foods-market",
    name: "Whole Foods Market",
    category: "gastronomia",
    description: "Premium grocery chain specializing in organic and natural foods",
    rating: 4.4,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/1435752/pexels-photo-1435752.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Amazon",
        cardName: "Credit Card",
        benefit: "5% back at Whole Foods for Prime members",
        rewardRate: "5% cash back",
        color: "bg-orange-500",
        icon: "CreditCard",
        tipo: "Cashback con Membresía",
        cuando: "Mientras mantengas Amazon Prime activo",
        valor: "5%",
        claseDeBeneficio: "Supermercados Premium",
        condicion: "Requiere membresía Amazon Prime activa",
        requisitos: [
          "Membresía Amazon Prime vigente",
          "Tarjeta Amazon Credit Card activa",
          "Compras realizadas en Whole Foods Market"
        ],
        usos: [
          "Whole Foods Market tiendas físicas",
          "Whole Foods delivery via Amazon"
        ],
        textoAplicacion: "Cashback se refleja como crédito en tu cuenta Amazon dentro de 1-2 días hábiles."
      },
      {
        bankName: "American Express",
        cardName: "Credit Card",
        benefit: "Earn 6% on supermarkets",
        rewardRate: "6% cash back",
        color: "bg-yellow-500",
        icon: "CreditCard",
        tipo: "Cashback Supermercados",
        cuando: "Hasta $6,000 en compras anuales",
        valor: "6%",
        tope: "$6,000 anuales, luego 1%",
        claseDeBeneficio: "Supermercados",
        condicion: "Máximo $6,000 en compras elegibles por año",
        requisitos: [
          "Tarjeta American Express activa",
          "Compras en supermercados de EE.UU."
        ],
        usos: [
          "Supermercados en Estados Unidos",
          "Tiendas de comestibles independientes"
        ],
        textoAplicacion: "Cashback acreditado mensualmente. Después de $6,000 anuales, la tasa baja a 1%."
      },
    ],
    lastUpdated: Date.now() - 3000000, // 50 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "netflix",
    name: "Netflix",
    category: "entretenimiento",
    description: "Leading streaming entertainment service with original content",
    rating: 4.1,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/265685/pexels-photo-265685.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Chase",
        cardName: "Premium Card",
        benefit: "Earn 3x points on streaming",
        rewardRate: "3x points",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Puntos por Streaming",
        cuando: "Promoción válida hasta 30/06/2025",
        valor: "3 puntos por cada $1",
        claseDeBeneficio: "Entretenimiento Digital",
        condicion: "Aplicable solo a servicios de streaming elegibles",
        requisitos: [
          "Suscripción activa a servicios de streaming",
          "Pago con tarjeta Chase Premium"
        ],
        usos: [
          "Netflix",
          "Disney+",
          "Spotify",
          "Apple Music",
          "Otros servicios de streaming elegibles"
        ],
        textoAplicacion: "Puntos se acreditan automáticamente en tu próximo estado de cuenta."
      },
      {
        bankName: "American Express",
        cardName: "Credit Card",
        benefit: "Earn 1.5% on all purchases",
        rewardRate: "1.5% cash back",
        color: "bg-yellow-500",
        icon: "CreditCard",
        tipo: "Cashback Base",
        valor: "1.5%",
        claseDeBeneficio: "Compras Generales",
        requisitos: [],
        usos: [
          "Cualquier comercio que acepte American Express"
        ]
      },
    ],
    lastUpdated: Date.now() - 600000, // 10 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "hilton-hotels",
    name: "Hilton Hotels",
    category: "viajes",
    description: "Global hospitality company with luxury and business hotels",
    rating: 4.6,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Hilton",
        cardName: "Premium Card",
        benefit: "Earn 7x points at Hilton properties",
        rewardRate: "7x points",
        color: "bg-purple-500",
        icon: "CreditCard",
        tipo: "Puntos Hoteleros",
        cuando: "Beneficio permanente para portadores de tarjeta",
        valor: "7 puntos Hilton Honors por cada $1",
        claseDeBeneficio: "Hospitalidad Premium",
        condicion: "Válido solo en propiedades Hilton participantes",
        requisitos: [
          "Tarjeta Hilton Premium activa",
          "Membresía Hilton Honors (gratuita)",
          "Reserva directa con Hilton"
        ],
        usos: [
          "Hoteles Hilton",
          "Conrad Hotels",
          "Waldorf Astoria",
          "DoubleTree",
          "Hampton Inn",
          "Otros hoteles de la familia Hilton"
        ],
        textoAplicacion: "Puntos se acreditan automáticamente en tu cuenta Hilton Honors dentro de 24-48 horas."
      },
      {
        bankName: "Chase",
        cardName: "Premium Card",
        benefit: "Earn 2x points on travel",
        rewardRate: "2x points",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Puntos de Viaje",
        valor: "2 puntos por cada $1",
        claseDeBeneficio: "Viajes",
        condicion: "Aplicable a todas las compras relacionadas con viajes",
        requisitos: [
          "Compras en categoría de viajes"
        ],
        usos: [
          "Aerolíneas",
          "Hoteles",
          "Alquiler de autos",
          "Agencias de viaje",
          "Cruceros"
        ],
        textoAplicacion: "Puntos Ultimate Rewards transferibles a múltiples programas de lealtad."
      },
      {
        bankName: "Capital One",
        cardName: "Rewards Card",
        benefit: "Earn 2x miles on all purchases",
        rewardRate: "2x miles",
        color: "bg-red-500",
        icon: "CreditCard",
        tipo: "Millas Universales",
        valor: "2 millas por cada $1",
        claseDeBeneficio: "Compras Generales",
        condicion: "Sin restricciones de categoría",
        requisitos: [],
        usos: [
          "Cualquier comercio",
          "Compras online",
          "Servicios",
          "Facturas"
        ]
      },
    ],
    lastUpdated: Date.now() - 1200000, // 20 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "zara",
    name: "Zara",
    category: "moda",
    description: "International fashion retailer offering trendy clothing and accessories",
    rating: 4.0,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "BBVA",
        cardName: "Credit Card",
        benefit: "10% discount on fashion purchases",
        rewardRate: "10% discount",
        color: "bg-green-500",
        icon: "CreditCard",
        tipo: "Descuento Moda",
        cuando: "Válido los fines de semana",
        valor: "10%",
        tope: "Descuento máximo $100 por compra",
        claseDeBeneficio: "Moda y Accesorios",
        condicion: "Aplicable solo sábados y domingos",
        requisitos: [
          "Compra mínima de $50",
          "Válido solo fines de semana",
          "Tarjeta BBVA activa"
        ],
        usos: [
          "Zara tiendas físicas",
          "Zara online con tarjeta BBVA",
          "Otras tiendas de moda participantes"
        ],
        textoAplicacion: "Descuento aplicado automáticamente en caja. Válido sábados y domingos únicamente."
      },
      {
        bankName: "Banco Ciudad",
        cardName: "Tarjeta Martes",
        benefit: "Descuento especial todos los martes",
        rewardRate: "15%",
        color: "bg-blue-500",
        icon: "CreditCard",
        tipo: "Descuento Semanal",
        cuando: "Disponible siempre",
        valor: "15%",
        tope: "Descuento máximo $200 por compra",
        claseDeBeneficio: "Gastronomía",
        condicion: "todos los martes",
        requisitos: [
          "Tarjeta activa",
          "Compra mínima de $100"
        ],
        usos: [
          "Restaurantes participantes",
          "Delivery de comida",
          "Cafeterías"
        ],
        textoAplicacion: "Presentar tarjeta antes del pago. Válido exclusivamente los martes."
      },
      {
        bankName: "Santander",
        cardName: "Business Card",
        benefit: "Earn 2x points on clothing",
        rewardRate: "2x points",
        color: "bg-pink-500",
        icon: "CreditCard",
        tipo: "Puntos Empresariales",
        valor: "2 puntos por cada $1",
        claseDeBeneficio: "Vestuario Empresarial",
        condicion: "Para compras de vestuario empresarial",
        requisitos: [
          "Cuenta empresarial Santander",
          "Compras en tiendas de ropa formal"
        ],
        usos: [
          "Tiendas de ropa formal",
          "Uniformes empresariales",
          "Accesorios profesionales"
        ],
        textoAplicacion: "Puntos acreditados en el programa Santander Empresas."
      },
    ],
    lastUpdated: Date.now() - 2100000, // 35 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
  {
    id: "fitness-first",
    name: "Fitness First",
    category: "deportes",
    description: "Premium fitness center with state-of-the-art equipment and classes",
    rating: 4.3,
    location: "Multiple locations",
    image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400",
    benefits: [
      {
        bankName: "Banco Nación",
        cardName: "Rewards Card",
        benefit: "15% discount on monthly memberships",
        rewardRate: "15% discount",
        color: "bg-teal-500",
        icon: "CreditCard",
        tipo: "Descuento Fitness",
        cuando: "Promoción válida hasta 31/03/2025",
        valor: "15%",
        tope: "Descuento máximo $50 por mes",
        claseDeBeneficio: "Salud y Bienestar",
        condicion: "Aplicable solo a membresías mensuales",
        requisitos: [
          "Débito automático activado",
          "Membresía mensual (no anual)",
          "Tarjeta Banco Nación activa"
        ],
        usos: [
          "Fitness First",
          "Otros gimnasios participantes",
          "Clases grupales incluidas"
        ],
        textoAplicacion: "Descuento aplicado automáticamente en el débito mensual. Configura débito automático para acceder al beneficio."
      },
      {
        bankName: "Galicia",
        cardName: "Premium Card",
        benefit: "Cashback on fitness expenses",
        rewardRate: "5% cashback",
        color: "bg-cyan-500",
        icon: "CreditCard",
        tipo: "Cashback Wellness",
        valor: "5%",
        tope: "$200 cashback por mes",
        claseDeBeneficio: "Bienestar",
        condicion: "Aplicable a gastos relacionados con fitness y bienestar",
        requisitos: [
          "Tarjeta Galicia Premium activa",
          "Gastos mínimos de $100 por mes en la categoría"
        ],
        usos: [
          "Gimnasios",
          "Estudios de yoga",
          "Entrenadores personales",
          "Suplementos deportivos",
          "Equipamiento fitness"
        ],
        textoAplicacion: "Cashback acreditado automáticamente en tu resumen mensual."
      },
    ],
    lastUpdated: Date.now() - 1500000, // 25 minutes ago
    isFavorite: false,
    imageLoaded: true
  },
];

export const categories = [
  { value: "all", label: "Todos" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "moda", label: "Moda" },
  { value: "entretenimiento", label: "Entretenimiento" },
  { value: "otros", label: "Otros" },
  { value: "deportes", label: "Deportes" },
  { value: "regalos", label: "Regalos" },
  { value: "viajes", label: "Viajes" },
  { value: "automotores", label: "Automotores" },
  { value: "belleza", label: "Belleza" },
  { value: "jugueterias", label: "Jugueterías" },
  { value: "hogar", label: "Hogar y Deco" },
  { value: "electro", label: "Electro y Tecnología" },
  { value: "shopping", label: "Shopping" },
];
