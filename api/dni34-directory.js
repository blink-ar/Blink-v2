import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const legalPin='bf7d7802edf670cd0f21542ba23becae11bf4e6aab0a0903f5c680e5a526d595';
const officialUrl='https://www.bancoprovincia.com.ar/cuentadni/buscadores/especialahorro15';
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Dedicated source-native contract. Never joins legacy1069 or merchant_assets.
 * Feature configuration is a release gate, NOT evidence of user authorization.
 * Real deployment/activation remains an explicit external operational step.
 */
export function validateDni34Snapshot(bytes,expectedSHA){
 if(!hash(expectedSHA)||bytes.length>2097152||sha(bytes)!==expectedSHA)throw Error('SNAPSHOT_PIN');
 const s=JSON.parse(bytes.toString('utf8')),t=s.terms;
 if(s.schemaVersion!==1||s.promotionId!=='1069'||s.sourceId!=='34'||!text(s.version,128)||!/^\d{4}-\d\d-\d\dT/.test(s.observedAt)||!Number.isFinite(Date.parse(s.observedAt))||s.publicationAuthorized!==false||s.kind!=='cuentadni-source-native-snapshot'||s.provider!=='banco-provincia'||s.identityMode!=='provider-branch'||s.pointInTime!==false||s.aggregateTermsConflict!==true)throw Error('SNAPSHOT_SCOPE');
 if(!t||t.discountPercentage!==15||JSON.stringify(t.weekdays)!=='["monday","tuesday"]'||t.validFrom!=='2026-09-01'||t.validUntil!=='2026-12-29'||t.cap?.amount!==7000||t.cap.currency!=='ARS'||JSON.stringify(t.cap.per)!=='["CUIT","week","person"]'||t.officialUrl!==officialUrl||t.legalSHA256!==legalPin||typeof t.legalText!=='string'||sha(t.legalText)!==legalPin)throw Error('TERMS_CONFLICT');
 if(!hash(s.evidence.captureSHA)||!hash(s.evidence.descriptorSHA)||!Array.isArray(s.branches)||!s.branches.length||s.branches.length>2000)throw Error('EVIDENCE_SCOPE');
 if(s.coverage?.observedRows!==s.branches.length||s.coverage.matchingPasses!==2||s.coverage.label!=='two-matching-traversals'||!Array.isArray(s.evidence.bodySHAs)||s.evidence.bodySHAs.length!==6||!s.evidence.bodySHAs.every(hash)||s.version!=='source34-'+sha(JSON.stringify({captureSHA:s.evidence.captureSHA,descriptorSHA:s.evidence.descriptorSHA,legalSHA:t.legalSHA256})))throw Error('COVERAGE_VERSION');
 const seen=new Set(),branches=s.branches.map(b=>{if(!text(b.id,128)||seen.has(b.id)||!text(b.name,512)||!text(b.address,1024)||!text(b.locality,512))throw Error('BRANCH_SCOPE');seen.add(b.id);return {branchId:b.id,name:b.name,address:b.address,locality:b.locality};}).sort((a,b)=>a.branchId<b.branchId?-1:a.branchId>b.branchId?1:0);
 return {schemaVersion:1,promotionId:'1069',sourceId:'34',version:s.version,observedAt:s.observedAt,terms:{discountPercentage:15,weekdays:['monday','tuesday'],validFrom:t.validFrom,validUntil:t.validUntil,cap:{amount:7000,currency:'ARS',per:['CUIT','week','person']},legalText:t.legalText,officialUrl,legalHash:legalPin},evidence:{manifestSHA:s.evidence.captureSHA,descriptorSHA:s.evidence.descriptorSHA,pointInTime:false},branches};
}
export async function dni34Page(url,{env=process.env,read=readFile,now=()=>new Date()}={}){
 if(env.BLINK_DNI34_PUBLIC_ENABLED!=='on')return {status:404,body:{error:'Not found'}};
 if(!env.BLINK_DNI34_SNAPSHOT_PATH||!hash(env.BLINK_DNI34_SNAPSHOT_SHA))return {status:503,body:{error:'Directory unavailable'}};
 let snapshot;try{snapshot=validateDni34Snapshot(await read(env.BLINK_DNI34_SNAPSHOT_PATH),env.BLINK_DNI34_SNAPSHOT_SHA);}catch{return {status:503,body:{error:'Directory unavailable'}};}
 const current=now(),observed=new Date(snapshot.observedAt),ttl=Number(env.BLINK_DNI34_MAX_AGE_HOURS||48);
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(current);
 if(!Number.isFinite(ttl)||ttl<1||ttl>168||observed>current||current-observed>ttl*3600000||day<snapshot.terms.validFrom||day>snapshot.terms.validUntil)return {status:503,body:{error:'Directory unavailable'}};
 const requested=url.searchParams.get('version');const rawPage=url.searchParams.get('page')||'1';
 if(!/^[1-9]\d{0,3}$/.test(rawPage))return {status:400,body:{error:'Invalid page'}};
 const page=Number(rawPage),totalPages=Math.ceil(snapshot.branches.length/50);
 if((page>1&&!requested)||(requested&&requested!==snapshot.version))return {status:409,body:{error:'Snapshot changed. Restart from page1.'}};
 if(page>totalPages)return {status:404,body:{error:'Page not found'}};
 const {branches,...meta}=snapshot;
 return {status:200,body:{...meta,branches:branches.slice((page-1)*50,page*50),coverage:{observedBranches:branches.length,exactCurrentDirectory:false,pointInTime:false,canonicalMapping:'unknown'},pagination:{page,pageSize:50,totalPages,version:snapshot.version,previous:page>1?page-1:null,next:page<totalPages?page+1:null}}};
}
export function renderDni34Page(body){
 const p=body.pagination,link=n=>`/cuenta-dni/fuente-34?version=${encodeURIComponent(body.version)}&page=${n}`;
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cuenta DNI · Comercios de fuente34</title><style>body{font:16px system-ui;max-width:850px;margin:2rem auto;padding:1rem}article{padding:1rem 0;border-bottom:1px solid #ddd}nav{display:flex;gap:2rem}details{margin:2rem 0}</style></head><body><a href="/">Blink</a><h1>Cuenta DNI · Ahorro del 15%</h1><p>Lunes y martes, del 1 de septiembre al 29 de diciembre de 2026. Tope $7.000 por CUIT, semana y persona. Consultá las condiciones completas.</p><p>Direcciones informadas por Banco Provincia. ${body.coverage.observedBranches} sedes en la nómina observada el ${escape(body.observedAt)}. Puede cambiar; consultá la fuente oficial. Direcciones textuales, sin ubicación verificada en el mapa.</p><p>Página ${p.page} de ${p.totalPages}</p><nav>${p.previous?`<a rel="prev" href="${escape(link(p.previous))}">Anterior</a>`:''}${p.next?`<a rel="next" href="${escape(link(p.next))}">Siguiente</a>`:''}</nav>${body.branches.map(b=>`<article><h2>${escape(b.name)}</h2><p>${escape(b.address)} · ${escape(b.locality)}</p></article>`).join('')}<details><summary>Condiciones completas</summary><p>${escape(body.terms.legalText)}</p><a href="${officialUrl}" rel="noopener noreferrer">Fuente oficial</a></details><p>Este directorio corresponde únicamente a fuente 34 de la promoción 1069. No atribuye sus condiciones a otras fuentes.</p></body></html>`;
}
export async function handleDni34Directory(req,res,url,options={}){
 res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.status(405);return res.send('Method not allowed');}
 const result=await dni34Page(url,options);res.status(result.status);
 const html=options.format==='html'||(!options.format&&url.pathname.endsWith('/page'));res.setHeader('Content-Type',html?'text/html; charset=utf-8':'application/json; charset=utf-8');
 return res.send(req.method==='HEAD'?'':html?(result.status===200?renderDni34Page(result.body):'<!doctype html><html lang="es"><meta charset="utf-8"><title>Directorio no disponible</title><p>Este directorio no está disponible.</p></html>'):JSON.stringify(result.body));
}
