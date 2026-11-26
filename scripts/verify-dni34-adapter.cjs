const fs=require('fs'),path=require('path');
// Uses an explicitly selected ALREADY INSTALLED official adapter, never installs.
const pkg=process.argv[5],dependencies=process.argv[6];if(!pkg||!dependencies)throw Error('Usage: node verify-dni34-adapter.cjs SOURCE OUTPUT NEW_WORKDIR INSTALLED_ADAPTER_NODE_MODULES EXISTING_APP_NODE_MODULES');
// Validate all destinations before loading the adapter or writing anything.
const sourcePath=fs.realpathSync(process.argv[2]),dependencyPath=fs.realpathSync(dependencies),repoPath=fs.realpathSync(path.resolve(__dirname,'..'));
const exists=p=>{try{fs.lstatSync(p);return true}catch(e){if(e.code==='ENOENT')return false;throw e}};
const fresh=p=>{const absolute=path.resolve(p);if(exists(absolute))throw Error('NEW_DIRECTORY_REQUIRED');return path.join(fs.realpathSync(path.dirname(absolute)),path.basename(absolute));};
const target=fresh(process.argv[3]),workPath=fresh(process.argv[4]);
const nested=(a,b)=>a===b||a.startsWith(b+path.sep),overlap=(a,b)=>nested(a,b)||nested(b,a);
if(overlap(target,workPath)||[sourcePath,dependencyPath,repoPath,fs.realpathSync(pkg)].some(p=>overlap(target,p)||overlap(workPath,p)))throw Error('DIRECTORY_SCOPE_OVERLAP');
const adapter=require(pkg+'/@vercel/node'),utils=require(pkg+'/@vercel/build-utils');
(async()=>{fs.mkdirSync(workPath,{mode:0o700});if(!fs.existsSync(path.join(workPath,'node_modules')))fs.cpSync(fs.realpathSync(dependencies),path.join(workPath,'node_modules'),{recursive:true});const files=await utils.glob('{api,server,shared,dist,server-artifacts}/**/*',sourcePath);files['package.json']=new utils.FileFsRef({fsPath:path.join(sourcePath,'package.json')});
const result=await adapter.build({files,entrypoint:'api/[...path].js',workPath,config:{includeFiles:'{dist/index.html,server-artifacts/*.json}',nodeVersion:'24.x',projectSettings:{installCommand:'',buildCommand:'true'}},meta:{},considerBuildCommand:true});
const output=result.output;if(!output.files?.['server-artifacts/dni34.json'])throw Error('Snapshot missing from real adapter output');console.log(JSON.stringify({handler:output.handler,runtime:output.runtime,fileCount:Object.keys(output.files).length,snapshotIncluded:true}));
fs.mkdirSync(target,{mode:0o700});for(const [name,file]of Object.entries(output.files||{})){if(path.isAbsolute(name)||name.split('/').includes('..'))throw Error('unsafe '+name);const dest=path.join(target,name);fs.mkdirSync(path.dirname(dest),{recursive:true});if(file.fsPath){if(fs.lstatSync(file.fsPath).isSymbolicLink()){const link=fs.readlinkSync(file.fsPath);if(path.isAbsolute(link)||path.resolve(path.dirname(dest),link).startsWith(target+path.sep)===false)throw Error('external symlink');try{fs.symlinkSync(link,dest)}catch(e){if(e.code!=='EEXIST')throw e;}}else fs.copyFileSync(file.fsPath,dest);}else if(file.data){fs.writeFileSync(dest,file.data);}else{const stream=await file.toStream();console.log('streamtype',name,typeof stream,stream?.constructor?.name);throw Error('unhandledfile');}}
fs.writeFileSync(path.join(target,'adapter-result.json'),JSON.stringify({adapterVersion:require(pkg+'/@vercel/node/package.json').version,handler:output.handler,runtime:output.runtime,fileCount:Object.keys(output.files||{}).length},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
