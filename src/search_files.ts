import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string) {
  let results: string[] = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fullPath.includes('node_modules') || fullPath.includes('.git')) return;
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    });
  } catch (e) {
    // ignore
  }
  return results;
}

console.log("ALL FILES IN WORKSPACE:");
const files = walkDir('.');
files.forEach(f => console.log(f));
