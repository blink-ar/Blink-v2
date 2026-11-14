// Local packaging only. Explicit source path + independently supplied SHA required.
import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
import {validateDni34Snapshot} from '../api/dni34-directory.js';
const [source,expectedSHA]=process.argv.slice(2);if(!source||!expectedSHA)throw Error('Usage: node scripts/stage-dni34-snapshot.mjs PRIVATE_SOURCE SHA256');
const bytes=await readFile(source);const verified=validateDni34Snapshot(bytes,expectedSHA);
const target=new URL('../server-artifacts/',import.meta.url);await mkdir(target,{recursive:true,mode:0o700});await writeFile(new URL('dni34.json',target),bytes,{mode:0o600});console.log(JSON.stringify({staged:path.join('server-artifacts','dni34.json'),version:verified.version,branches:verified.branches.length,publicationEnabled:false}));
