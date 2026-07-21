const fs=require('fs');
const path=require('path');
const root=__dirname;
const out=path.join(root,'dist');
const files=['index.html','styles.css','app.js','content.json','robots.txt','sitemap.xml','404.html','vercel.json'];
const dirs=['assets','ditz-control'];
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of files){fs.copyFileSync(path.join(root,file),path.join(out,file));}
for(const dir of dirs){fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});}
console.log('DiTz Store static build ready in dist/');
