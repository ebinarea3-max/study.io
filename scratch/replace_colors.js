const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  }
  return filelist;
};

// Background colors
const bgRegex = /bg-\[\#(0A0C10|0a0c10|090A0C|090a0c|080C15|080c15|0B0C0E|0b0c0e|06080F|06080f|050811|12100d|12100D)\]/g;
// Surface/Card colors
const surfaceRegex = /bg-\[\#(14171D|14171d|0c0d12|0C0D12|0c0d10|0C0D10|14161C|14161c|0d0e12|0D0E12)\]/g;
// Border colors (optional, but let's just do standard white/[0.08] or similar? Actually the user said "active borders use var(--border)". Let's leave static borders alone unless it's a specific active element, or replace all border-white/[0.08] with border-[var(--border)]).
const borderRegex = /border-white\/\[0\.08\]/g;
const borderRegex2 = /border-white\/\[0\.1\]/g;
const borderRegex3 = /border-white\/\[0\.12\]/g;

const files = walkSync('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(bgRegex, 'bg-[var(--bg)]');
  content = content.replace(surfaceRegex, 'bg-[var(--surface)]');
  content = content.replace(borderRegex, 'border-[var(--border)]');
  content = content.replace(borderRegex2, 'border-[var(--border)]');
  content = content.replace(borderRegex3, 'border-[var(--border)]');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
