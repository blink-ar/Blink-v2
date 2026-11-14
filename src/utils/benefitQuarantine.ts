import { isCuentaDni1069Quarantined } from '../../shared/benefit-quarantine.js';
import type { Business } from '../types';
export const clientQuarantineEnabled = import.meta.env.VITE_CUENTADNI_1069_QUARANTINE !== 'off';
export const isQuarantinedBenefit = (value: unknown): boolean => isCuentaDni1069Quarantined(value, clientQuarantineEnabled);
export const filterQuarantinedBenefits = <T>(rows: T[]): T[] => rows.filter(row=>!isQuarantinedBenefit(row));
export function quarantineBusiness<T extends Business>(business:T):T {
 if(!clientQuarantineEnabled)return business;
 const benefits=filterQuarantinedBenefits(business.benefits||[]);
 const removed=benefits.length!==(business.benefits||[]).length;
 if(!removed&&business.quarantineSummaryVersion===1)return business;
 // A cached preview may omit1069 even when its aggregate claims include it.
 // Only the current API hydration stamp establishes filtered summaries. The
 // stamp never bypasses filtering actual cards; any removal invalidates it.
 return {...business,benefits,benefitCount:null,banks:[],maxDiscountPercentage:undefined};
}
export const benefitCountLabel=(count:number|null|undefined, fallback:number):string=>count===null?'Beneficios disponibles':`${count??fallback} ${(count??fallback)===1?'beneficio':'beneficios'}`;
