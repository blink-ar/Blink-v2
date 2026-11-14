import test from 'node:test';import assert from 'node:assert/strict';import {MongoClient} from 'mongodb';
import {readBranchScopeShadow,observeBranchScopeShadow,LEDGER} from '../api/branch-scope-shadow.js';
const hash=n=>n.toString(16).padStart(64,'0'),benefitId='cuentadni-benefit-1069-old',bindingVersion=hash(99);
const merchants=[{merchantId:'m',locations:[{id:'a',lat:0,lng:1},{id:'b',lat:0,lng:0}]}];
const scope={benefitId,bindingVersion,merchants,origin:{lat:0,lng:0}};
const row=(n,patch={})=>({_id:hash(n),schemaVersion:1,provider:'banco-provincia',sourceId:'34',promotionId:'1069',benefitId,bindingVersion,status:'quarantined',merchantId:'m',locationId:'a',providerBranchId:'provider-'+n,evidence:{descriptorSHA:hash(1),rawSHA:hash(2),receiptSHA:hash(3),mappingSHA:hash(4)},revision:1,...patch});
test('disabled or mistaken true has zero DB reads',async()=>{const db={collection(){throw Error('must not read');}};assert.equal(await observeBranchScopeShadow(db,merchants,undefined,{}),null);assert.equal(await observeBranchScopeShadow(db,merchants,undefined,{BLINK_DNI_BRANCH_MODE:'true'}),null);});
test('scope guards before read',async()=>{const db={collection(){throw Error('must not read');}};for(const patch of [{benefitId:'cuentadni-benefit-10690-old'},{bindingVersion:'x'},{limit:501},{merchants:Array(26).fill(merchants[0])},{after:'bad'}])await assert.rejects(readBranchScopeShadow(db,{...scope,...patch}),/INVALID_SHADOW_SCOPE/);});
const uri='mongodb://127.0.0.1:27143/?directConnection=true';
test('real isolated ledger batch, pages, exact branch, geo, incomplete coverage,1089 untouched',{skip:process.env.BLINK_QUARANTINE_TEST_URI!==uri},async()=>{
 const client=new MongoClient(uri);await client.connect();const db=client.db('dni_shadow_fixture_'+process.pid);
 try{
 const indexName=await db.collection(LEDGER).createIndex({benefitId:1,bindingVersion:1,sourceId:1,status:1,merchantId:1,_id:1});
 await db.collection(LEDGER).insertMany([row(1),row(2,{locationId:'missing'}),row(3,{evidence:{}}),row(4,{sourceId:'8',locationId:'b'}),row(5,{benefitId:'cuentadni-benefit-1089-good'}),row(6,{bindingVersion:hash(100)}),row(7)]);
 const plan=await db.collection(LEDGER).find({benefitId,bindingVersion,sourceId:'34',status:'quarantined',merchantId:{$in:['m']}}).sort({_id:1}).limit(501).hint(indexName).explain('queryPlanner');assert.ok(JSON.stringify(plan).includes('IXSCAN'));
 const r=await readBranchScopeShadow(db,{...scope,limit:2});assert.equal(r.cards.length,1);assert.equal(r.rejected,1);assert.equal(r.cards[0].location.id,'a');assert.ok(r.cards[0].distanceKm>111);assert.equal(r.cards[0].publicationAllowed,false);assert.equal(r.total,null);assert.equal(r.coverageComplete,false);assert.equal(r.hasMoreKnown,true);assert.equal(r.nextCursor,hash(2));
 const p=await readBranchScopeShadow(db,{...scope,after:r.nextCursor,limit:2});assert.equal(p.cards.length,1);assert.equal(p.rejected,1);assert.equal(p.hasMoreKnown,false);assert.equal(p.total,null);assert.equal(p.coverageComplete,false);assert.equal(await db.collection(LEDGER).countDocuments({benefitId:'cuentadni-benefit-1089-good'}),1);
 const env={BLINK_DNI_BRANCH_MODE:'shadow',BLINK_DNI_SHADOW_BENEFIT_ID:benefitId,BLINK_DNI_SHADOW_BINDING_VERSION:bindingVersion};const metrics=await observeBranchScopeShadow(db,merchants,scope.origin,env);assert.equal(metrics.eligiblePageRows,1);assert.equal(metrics.cards,undefined);assert.equal(JSON.stringify(metrics).includes(benefitId),false);
 const duplicates=[{merchantId:'m',locations:[...merchants[0].locations,{...merchants[0].locations[0]}]}];assert.equal((await readBranchScopeShadow(db,{...scope,merchants:duplicates})).cards.length,0);
 }finally{await db.dropDatabase();await client.close();}
});

test('serialized real Mongo writer output consumed without schema mocking',{skip:process.env.BLINK_QUARANTINE_TEST_URI!==uri},async()=>{
 const {readFile}=await import('node:fs/promises');
 const written=JSON.parse(await readFile(new URL('./fixtures/dni-mapped-writer.json',import.meta.url),'utf8'));
 const client=new MongoClient(uri);await client.connect();const db=client.db('dni_writer_reader_fixture_'+process.pid);
 try{await db.collection(LEDGER).insertOne(written);const input={benefitId:written.benefitId,bindingVersion:written.bindingVersion,merchants:[{merchantId:written.merchantId,locations:[{id:written.locationId,lat:0,lng:1},{id:'noneligible',lat:0,lng:0}]}],origin:{lat:0,lng:0}};const result=await readBranchScopeShadow(db,input);assert.equal(result.cards.length,1);assert.equal(result.cards[0].location.id,written.locationId);assert.ok(result.cards[0].distanceKm>111);assert.equal(result.cards[0].publicationAllowed,false);assert.equal(result.total,null);}finally{await db.dropDatabase();await client.close();}
});
