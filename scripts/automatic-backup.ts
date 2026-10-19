import {readFile,mkdir,writeFile,rename,readdir,stat,open,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {parseBackup,checkBackupMemory,BACKUP_LIMIT} from '../server/backup';
const configPath=process.argv[2];
if(!configPath)throw Error('Configuration path required');
const config=JSON.parse(await readFile(configPath,'utf8'));
const directory=config.directory as string;
await mkdir(directory,{recursive:true,mode:0o700});
const statusPath=join(directory,'status.json'),lockPath=join(directory,'.backup.lock');
// launchd serializes scheduled runs; this also prevents an overlapping manual run.
let lock;
try{lock=await open(lockPath,'wx',0o600);}catch(error:any){if(error.code!=='EEXIST')throw error;const info=await stat(lockPath);if(Date.now()-info.mtimeMs<10*60*1000)process.exit(0);await unlink(lockPath);lock=await open(lockPath,'wx',0o600);}
async function atomic(path:string,text:string){const tmp=path+'.tmp';await writeFile(tmp,text,{mode:0o600});await rename(tmp,path);}
try{
 const url=new URL(config.url);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('HTTPS endpoint required');
 const response=await fetch(url,{headers:{Authorization:'Bearer '+config.token},redirect:'error',signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('HTTP '+response.status+'：バックアップを取得できませんでした');
 const reader=response.body!.getReader();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>BACKUP_LIMIT){await reader.cancel();throw Error('20MBの保存上限を超えています');}chunks.push(value);}
 const backup=parseBackup(JSON.parse(Buffer.concat(chunks).toString('utf8')));await checkBackupMemory(backup);
 const digest=createHash('sha256').update(JSON.stringify({...backup,exportedAt:''})).digest('hex');
 let previous:any={};try{previous=JSON.parse(await readFile(statusPath,'utf8'));}catch{}
 let lastFile=previous.lastFile,lastSavedAt=previous.lastSavedAt;
 let exists=false;if(lastFile)try{const saved=parseBackup(JSON.parse(await readFile(join(directory,lastFile),'utf8')));exists=createHash('sha256').update(JSON.stringify({...saved,exportedAt:''})).digest('hex')===digest;}catch{}
 if(!exists){lastFile='glass-tavern-backup-'+backup.exportedAt.replace(/[:.]/g,'-')+'.json';await atomic(join(directory,lastFile),JSON.stringify(backup));lastSavedAt=new Date().toISOString();}
 await atomic(statusPath,JSON.stringify({ok:true,lastCheckedAt:new Date().toISOString(),lastSavedAt,lastFile,digest,characters:backup.characters.length,chats:backup.chats.length,messages:backup.chats.reduce((n,c)=>n+c.messages.length,0)},null,2));
 console.log(exists?'変更なし：バックアップを確認しました':'バックアップを保存しました');
}catch(error:any){let previous:any={};try{previous=JSON.parse(await readFile(statusPath,'utf8'));}catch{}await atomic(statusPath,JSON.stringify({...previous,ok:false,lastCheckedAt:new Date().toISOString(),error:error.message||'Backup failed'},null,2));console.error('自動バックアップに失敗しました。status.jsonを確認してください。');process.exitCode=1;}finally{await lock.close();await unlink(lockPath);}
