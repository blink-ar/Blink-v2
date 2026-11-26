// Exact offer versions, with issuer-confirmed text addresses (not map points).
const restrictions = new Map([
  ['cuentadni-benefit-1087-d69ae6319a85ec60', Object.freeze({
    payment: 'Pago Clave DNI en caja',
    branches: Object.freeze(['Albertini 9, Lobos', 'Calle 7 Nº 1224, La Plata']),
    sourceUrl: 'https://www.bancoprovincia.com.ar/cuentadni/Home/GetBeneficioData2?idBeneficio=1087'
  })]
]);

export function getBenefitBranchRestriction(benefit) {
  return restrictions.get(benefit?.id) ?? null;
}
