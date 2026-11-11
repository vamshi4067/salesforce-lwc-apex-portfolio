import {rm,mkdir,cp,readFile,readdir,writeFile} from 'node:fs/promises';
import {zipSync} from 'fflate';
await rm('dist',{recursive:true,force:true});await mkdir('dist/assets',{recursive:true});await cp('public','dist',{recursive:true});
const data={};async function add(path){const entries=await readdir(path,{withFileTypes:true});for(const entry of entries){const name=path+'/'+entry.name;if(entry.isDirectory())await add(name);else data[name]=new Uint8Array(await readFile(name));}}
for(const dir of ['src','public','salesforce','tests','scripts'])await add(dir);
for(const file of ['README.md','package.json','rollup.config.mjs','netlify.toml'])data[file]=new Uint8Array(await readFile(file));
await writeFile('dist/onboarding-source.zip',zipSync(data));
