import { describe,it,expect,vi,afterEach } from 'vitest';
import {isCuentaDni1069Quarantined} from '../../../shared/benefit-quarantine.js';
import {filterQuarantinedBenefits,quarantineBusiness,benefitCountLabel} from '../benefitQuarantine';
import {normalizeBusinesses,benefitsAPI} from '../../services/api';
import {getRawBenefitById} from '../../services/rawBenefitsApi';
import type {Business,BankBenefit} from '../../types';
const blocked={id:'cuentadni-benefit-1069-9b2a6031f3bc4d76',discountPercentage:15,bankName:'Cuenta DNI',validUntil:'2099-12-31'} as BankBenefit;
const allowed={...blocked,id:'cuentadni-benefit-1089-a8d7d11eedc14465',discountPercentage:20};
const business={id:'merchant_example',name:'Example',category:'otros',description:'',rating:5,location:[],image:'',benefits:[blocked,allowed],benefitCount:99,banks:['stale provider'],maxDiscountPercentage:99} as Business;
afterEach(()=>vi.unstubAllGlobals());
describe('temporary client quarantine',()=>{
 it('exact canonical/raw/renewal namespaces only; otherbanks and10690 retained',()=>{for(const id of [blocked.id,'cuentadni-benefit-1069-'+'f'.repeat(64),'benefit:1069-0123456789abcdef'])expect(isCuentaDni1069Quarantined({id})).toBe(true);for(const id of ['cuentadni-benefit-10690-0123456789abcdef','galicia-1069-0123456789abcdef',allowed.id])expect(isCuentaDni1069Quarantined({id})).toBe(false);expect(isCuentaDni1069Quarantined(blocked,false)).toBe(false);});
 it('cached/route state business loses blocked card and stale aggregate claims without mutating source',()=>{const clean=quarantineBusiness(business);expect(clean.benefits).toEqual([allowed]);expect(clean.benefitCount).toBeNull();expect(clean.banks).toEqual([]);expect(clean.maxDiscountPercentage).toBeUndefined();expect(business.benefits).toHaveLength(2);expect(filterQuarantinedBenefits([blocked,allowed])).toEqual([allowed]);});
 it('bootstrap/network normalization excludes blocked cards even includeExpired',()=>{const clean=normalizeBusinesses([business],{includeExpired:true})[0];expect(clean.benefits.map(x=>x.id)).toEqual([allowed.id]);expect(clean.benefitCount).toBeNull();expect(clean.maxDiscountPercentage).toBeUndefined();});
 it('explicit unknown count is never presented as0 or stale99',()=>{expect(benefitCountLabel(null,0)).toBe('Beneficios disponibles');expect(benefitCountLabel(null,99)).toBe('Beneficios disponibles');expect(benefitCountLabel(1,99)).toBe('1 beneficio');});
 it('direct cached API benefit replies are denied by both raw and transformed detail adapters',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({benefit:blocked})})));expect(await benefitsAPI.getBenefitById(blocked.id!)).toBeNull();expect(await getRawBenefitById(blocked.id!)).toBeNull();});
});

it('truncated stale preview without1069 still cannot reuse its aggregate15percent or count',()=>{const clean=quarantineBusiness({...business,benefits:[allowed],benefitCount:50,maxDiscountPercentage:15});expect(clean.benefits).toEqual([allowed]);expect(clean.benefitCount).toBeNull();expect(clean.maxDiscountPercentage).toBeUndefined();expect(clean.banks).toEqual([]);});
it('fresh server stamp preserves filtered summary but never authorizes a quarantined card',()=>{const fresh={...business,benefits:[allowed],benefitCount:1,banks:['Cuenta DNI'],maxDiscountPercentage:20,quarantineSummaryVersion:1 as const};expect(quarantineBusiness(fresh)).toBe(fresh);const normalized=normalizeBusinesses([fresh],{includeExpired:true})[0];expect(normalized.quarantineSummaryVersion).toBe(1);expect(normalized.benefitCount).toBe(1);const poisoned=quarantineBusiness({...fresh,benefits:[blocked,allowed]});expect(poisoned.benefits).toEqual([allowed]);expect(poisoned.benefitCount).toBeNull();});
