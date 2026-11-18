import {isCuentaDni1069Quarantined} from '../shared/benefit-quarantine.js';
// Temporary, reversible read quarantine. No identity rewriting or data mutation.
// Default deny scope is upstream CuentaDNI promotion1069, including renewed hashes.
const MARKERS=['sourceCollection','rawBenefitCollection','source','sourceType','bank'];
const IDENTITIES=['id','_id','originalId','benefitDetailId','rawBenefitId'];
export function quarantineEnabled(env=process.env){return env.BLINK_CUENTADNI_1069_QUARANTINE!=='off';}
const canonical=/^cuentadni-benefit-1069(?:-|$)/i,raw=/^benefit:1069(?:-|$)/i,source=/^(?:CuentaDNI|CuentaDNI_BENEFITS|CUENTADNI_PROMOS_RAW|cuenta[ _-]?dni)$/i;
export function isQuarantinedBenefit(d,env=process.env){return isCuentaDni1069Quarantined(d,quarantineEnabled(env));}
export function publicBenefitMatch(query={},env=process.env){if(!quarantineEnabled(env))return query;const deny=IDENTITIES.flatMap(k=>[{[k]:{$regex:canonical}},{[k]:{$regex:raw}}]);deny.push({$and:[{$or:MARKERS.map(k=>({[k]:{$regex:source}}))},{benefitId:{$in:[1069,'1069']}}]});return {$and:[query,{$nor:deny}]};}
export function publicBenefitPipeline(pipeline,env=process.env){if(!quarantineEnabled(env))return pipeline;if(!Array.isArray(pipeline))throw Error('PIPELINE');if(pipeline.some(s=>s.$out||s.$merge))throw Error('READ_ONLY_PIPELINE');const copy=pipeline.map(s=>({...s}));if(copy[0]?.$geoNear){copy[0]={$geoNear:{...copy[0].$geoNear,query:publicBenefitMatch(copy[0].$geoNear.query??{},env)}};return copy;}if(copy[0]?.$search||copy[0]?.$vectorSearch){copy.splice(1,0,{$match:publicBenefitMatch({},env)});return copy;}return [{$match:publicBenefitMatch({},env)},...copy];}
export function filterPublicBenefitRows(rows,env=process.env){return rows.filter(d=>!isQuarantinedBenefit(d,env));}
const BENEFIT_COLLECTIONS=new Set(['confirmed_benefits','processed_benefits','benefits','bank_subscriptions']);
function guardedJoins(pipeline,env){return pipeline.map(stage=>{
 if(stage.$lookup){const v=stage.$lookup,p=guardedJoins(v.pipeline??[],env);return {$lookup:{...v,pipeline:BENEFIT_COLLECTIONS.has(v.from)?publicBenefitPipeline(p,env):p}};}
 if(stage.$unionWith){const v=typeof stage.$unionWith==='string'?{coll:stage.$unionWith}:stage.$unionWith,p=guardedJoins(v.pipeline??[],env);return {$unionWith:{...v,pipeline:BENEFIT_COLLECTIONS.has(v.coll)?publicBenefitPipeline(p,env):p}};}
 if(stage.$facet)return {$facet:Object.fromEntries(Object.entries(stage.$facet).map(([k,p])=>[k,guardedJoins(p,env)]))};
 return stage;
});}
// Query adapter only. This does not sanitize precomputed merchant summaries or
// already cached HTTP responses; deployment requires those separate protections.
export function quarantineReadDb(db,env=process.env){if(!quarantineEnabled(env))return db;return new Proxy(db,{get(target,key){if(key!=='collection'){const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}return name=>{const col=target.collection(name),benefit=BENEFIT_COLLECTIONS.has(name);return new Proxy(col,{get(c,k){if(k==='aggregate')return(p=[],...rest)=>c.aggregate(benefit?publicBenefitPipeline(guardedJoins(p,env),env):guardedJoins(p,env),...rest);if(benefit&&['find','findOne','countDocuments'].includes(k))return(q={},...rest)=>c[k](publicBenefitMatch(q,env),...rest);if(benefit&&k==='distinct')return(field,q={},...rest)=>c.distinct(field,publicBenefitMatch(q,env),...rest);if(benefit&&k==='estimatedDocumentCount')return()=>{throw Error('QUARANTINE_REQUIRES_FILTERED_COUNT')};const v=Reflect.get(c,k);return typeof v==='function'?v.bind(c):v;}});};}});}
