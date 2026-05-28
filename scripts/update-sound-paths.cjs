const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src', 'data.ts');
let text = fs.readFileSync(filePath, 'utf8');

// Normalize common patterns to local sound folder
text = text.replace(/sound:\s*'sounds\//g, "sound: '/src/assets/images/sounds/");
text = text.replace(/sound:\s*'days\//g, "sound: '/src/assets/images/sounds/days/");
text = text.replace(/sound:\s*'numbers\//g, "sound: '/src/assets/images/sounds/numbers/");
text = text.replace(/sound:\s*'months\//g, "sound: '/src/assets/images/sounds/months/");
text = text.replace(/sound:\s*'months\//g, "sound: '/src/assets/images/sounds/months/");
text = text.replace(/sound:\s*'months\//g, "sound: '/src/assets/images/sounds/months/");
// handle lone 'numbers/...' or 'days/...' without 'sound' prefix already covered, but below heuristic replaces within quotes
text = text.replace(/'numbers\//g, "'/src/assets/images/sounds/numbers/");
text = text.replace(/'days\//g, "'/src/assets/images/sounds/days/");
text = text.replace(/'months\//g, "'/src/assets/images/sounds/months/");

fs.writeFileSync(filePath, text, 'utf8');
console.log('Updated sound paths in src/data.ts');
