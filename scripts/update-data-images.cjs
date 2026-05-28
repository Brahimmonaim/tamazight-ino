const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src', 'data.ts');
let text = fs.readFileSync(filePath, 'utf8');
const lettersDir = path.join(process.cwd(), 'src', 'assets', 'images', 'letters');
const fruitsDir = path.join(process.cwd(), 'src', 'assets', 'images', 'fruits');
const organsDir = path.join(process.cwd(), 'src', 'assets', 'images', 'organs');
const fileExists = p => fs.existsSync(p);

text = text.replace(/\{\s*l:\s*'([^']+)',\s*label:\s*'([^']+)',\s*word:\s*'([^']+)',([\s\S]*?)img:\s*'([^']*)',([\s\S]*?)\}/g, (match, l, label, word, beforeImg, img, afterImg) => {
  const fileName = `${word}.png.png`;
  const fullPath = path.join(lettersDir, fileName);
  if (fileExists(fullPath)) {
    const newImg = `/src/assets/images/letters/${fileName}`;
    return match.replace(/img:\s*'[^']*'/, `img: '${newImg}'`);
  }
  return match;
});

text = text.replace(/\{\s*tif:\s*'([^']+)',\s*lat:\s*'([^']+)',([\s\S]*?)img:\s*'([^']*)',([\s\S]*?)sound:/g, (match, tif, lat, beforeImg, img, between) => {
  const fileName = `${tif}.png.png`;
  const fullPath = path.join(fruitsDir, fileName);
  if (fileExists(fullPath)) {
    const newImg = `/src/assets/images/fruits/${fileName}`;
    return match.replace(/img:\s*'[^']*'/, `img: '${newImg}'`);
  }
  return match;
});

text = text.replace(/\{\s*tif:\s*'([^']+)',\s*lat:\s*'([^']+)',([\s\S]*?)img:\s*'([^']*)',([\s\S]*?)sound:/g, (match, tif, lat, beforeImg, img, between) => {
  if (/sound:\s*'sounds\/organs\//.test(match)) {
    const base = tif.replace(/_ear$/, '');
    const fileName = `${base}.png`;
    const fullPath = path.join(organsDir, fileName);
    if (fileExists(fullPath)) {
      const newImg = `/src/assets/images/organs/${fileName}`;
      return match.replace(/img:\s*'[^']*'/, `img: '${newImg}'`);
    }
  }
  return match;
});

fs.writeFileSync(filePath, text, 'utf8');
console.log('Updated local image paths in src/data.ts');
