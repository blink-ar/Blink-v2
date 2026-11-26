// Diagnostic-only ledger consumer. Never merges its result into a public payload.
export const LEDGER='CUENTADNI_BRANCH_LEDGER_V1';
const sha=s=>typeof s==='string' && /^[a-f0-9]{64}$/.test(s);
const canonical=s=>typeof s==='string' && /^cuentadni-benefit-1069(?:-|$)/.test(s);
const id=s=>typeof s==='string' && s.length>0 && s.length<=256;
function km(a,b){if(![a?.lat,a?.lng,b?.lat,b?.lng].every(Number.isFinite))return null;const r=x=>x*Math.PI/180;const h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export async function readBranchScopeShadow(db,{benefitId,bindingVersion,merchants,after=null,limit=50,origin}){
 if(!canonical(benefitId)||!sha(bindingVersion)||!Array.isArray(merchants)||merchants.length>25||!Number.isSafeInteger(limit)||limit<1||limit>500||(after!==null&&!sha(after)))throw Error('INVALID_SHADOW_SCOPE');
 const merchantMap=new Map();
 for(const m of merchants){if(!id(m.merchantId)||merchantMap.has(m.merchantId))throw Error('AMBIGUOUS_MERCHANT');const locations=new Map();for(const l of m.locations||[]){if(!id(l.id))continue;locations.set(l.id,locations.has(l.id)?null:l);}merchantMap.set(m.merchantId,locations);}
 if(!merchants.length)return {cards:[],hasMoreKnown:false,nextCursor:null,total:null,coverageComplete:false};
 const query={schemaVersion:1,provider:'banco-provincia',sourceId:'34',promotionId:'1069',benefitId,bindingVersion,status:'quarantined',merchantId:{$in:[...merchantMap.keys()]},...(after?{_id:{$gt:after}}:{})};
 const rows=await db.collection(LEDGER).find(query,{projection:{_id:1,schemaVersion:1,provider:1,sourceId:1,promotionId:1,benefitId:1,bindingVersion:1,status:1,merchantId:1,locationId:1,providerBranchId:1,evidence:1,revision:1}}).sort({_id:1}).limit(limit+1).maxTimeMS(1000).toArray();
 const page=rows.slice(0,limit),cards=[],seen=new Set();let rejected=0;
 for(const row of page){
  const loc=merchantMap.get(row.merchantId)?.get(row.locationId);
  const valid=sha(row._id)&&id(row.providerBranchId)&&Number.isSafeInteger(row.revision)&&row.revision>0&&['descriptorSHA','rawSHA','receiptSHA','mappingSHA'].every(k=>sha(row.evidence?.[k]));
  if(!loc||!valid){rejected++;continue;}
  const dedupKey=JSON.stringify([row.merchantId,row.locationId]);
  if(seen.has(dedupKey))continue;seen.add(dedupKey);
  cards.push({benefitId,merchantId:row.merchantId,location:{...loc},branchScope:{bindingVersion,sourceId:'34',locationIdsScope:'page',eligibleLocationIds:[row.locationId]},distanceKm:km(origin,loc),publicationAllowed:false});
 }
 return {cards,rejected,hasMoreKnown:rows.length>limit,nextCursor:rows.length>limit?page.at(-1)._id:null,total:null,coverageComplete:false,mode:'shadow'};
}
/** Public callsites can opt into metrics only. Disabled means zero ledger reads.
 * true/on are NOT accepted. No debug endpoint, no content/IDs in metrics.
 * Errors never fall back to merchant-wide eligibility or change public results.
 */
export async function observeBranchScopeShadow(db,merchants,origin,env=process.env){
 if(env.BLINK_DNI_BRANCH_MODE!=='shadow')return null;
 try{
  const result=await readBranchScopeShadow(db,{benefitId:env.BLINK_DNI_SHADOW_BENEFIT_ID,bindingVersion:env.BLINK_DNI_SHADOW_BINDING_VERSION,merchants:merchants.slice(0,25),limit:50,origin});
  return {mode:'shadow',eligiblePageRows:result.cards.length,rejected:result.rejected,hasMoreKnown:result.hasMoreKnown,coverageComplete:false};
 }catch{return {mode:'shadow',held:true,coverageComplete:false};}
}
