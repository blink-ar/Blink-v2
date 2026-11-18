# Source34 branch consumer: shadow only

Base: frontend quarantine c66653a1a0792dd43fc8038a93217266709a1c9f.
Separate worktree/branch; original handoff unchanged. No push/deploy or production access.

## Interface
`readBranchScopeShadow(db, {benefitId,bindingVersion,merchants,after,limit,origin})` reads `CUENTADNI_BRANCH_LEDGER_V1`:
- Exact namespace1069, version SHA256, provider `banco-provincia`, source34, promotion1069, schema1 and status `quarantined`.
- Merchant IDs batch at most25. Limit at most500, reads limit+1 sentinel, _id seek cursor; server maxTimeMS1000.
- Fields: providerBranchId, merchantId, locationId, revision, evidence descriptorSHA/rawSHA/receiptSHA/mappingSHA. SHA checks are structural, not proof of authenticity. Trusted backend evidence resolver is required to produce rows.
- Merchant/location identity exact. Duplicate local location IDs fail closed. Alias/merged owners must be resolved upstream using verified evidence; names never establish eligibility.
- Diagnostic cards carry only eligible mapped location, page-scoped IDs and distance to that location. There is no merchant-wide nearest distance substitution.
- `total:null`, `coverageComplete:false` even on the final observed page. Exhausting available ledger rows is not proof of complete source coverage.

Backend coordination: no real mapped ledger producer is currently published. Real source34 rows remain unbound pending independently verified mapping; current backend design separates reusable directory observations from benefit applicability. This reader is a proposed optional mapped projection, demonstrated ONLY using synthetic fixture rows. Do not activate on production.

## Isolation and public compatibility
Mode defaults disabled. Only server env value `BLINK_DNI_BRANCH_MODE=shadow` evaluates the observer; `true`/`on` do not. Exact benefit/version also required via server env. No queryparam toggle or diagnostic endpoint.
Internal callsites on businesses, hydrated search and merchant SSR discard results. They do not merge cards, counts, IDs, locations or metrics into public responses/HTML. No new client code. Existing quarantine continues to deny1069 even with shadow enabled. Turning shadow off is immediate rollback of diagnostic work only, not a quarantine toggle.
The public contract cannot yet publish branch-scoped offers. This is an executable offline/internal projection plus non-publishing hooks, not a release-ready eligibility feature.

## Operational limits
No persistent public cursor API; cursor binding to immutable snapshot, cross-page conflict guarantees and snapshot lifecycle remain backend integration prerequisites. Page exhaustion does not establish global nearest eligible branch: each diagnostic distance belongs to the explicitly returned branch only. No aliases auto-resolved; unmapped branches omitted. Query failures return held metrics and leave public output unchanged. Additional shadow latency bounded per Mongo execution, not a blanket network deadline.

## Tests
19 Node tests pass with standalone local Mongo on127.0.0.1:27143 (no skips), including ledger pagination, exact source/version filter, unknown coverage, missing evidence/mapping,1089 unchanged, geo eligible and disabled zero DB calls.
Public API/SSR regression additionally passes with shadow explicitly enabled:1069 remains404/absent,1089 remains visible.
83 existing API/search regressions pass with quarantine rollback off and shadow disabled. Vite build checked separately.

Cross-component fixture `fixtures/dni-mapped-writer.json` is the serialized output of the companion backend's actual isolated Mongo transactional writer, using clearly fictional fixture identities/evidence. Reader test inserts that exact JSON and consumes it without reshaping the schema. This demonstrates structural writer/reader interoperability, NOT trusted production provenance. Final suite20/20 passes. Recommended projection index `{benefitId:1,bindingVersion:1,sourceId:1,status:1,merchantId:1,_id:1}` is demonstrated with IXSCAN in isolated Mongo (hint in test only); production requires an independently reviewed index/capacity plan. No index was created outside the fixture database. Repeated same merchant/location rows deduplicated within each returned page; cross-page uniqueness remains a writer/snapshot prerequisite.
