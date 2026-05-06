
import fs from 'fs';
import path from 'path';

const rootDir = 'd:/03_PROJECTS/KrishiConnect-main';
const appDir = path.join(rootDir, 'app/(client)');

const routesToTest = [
  '/',
  '/onboarding',
  '/marketplace',
  '/cart',
  '/farmer-dashboard',
  '/agent-dashboard',
  '/delivery-dashboard',
  '/admin',
  '/about',
  '/how-it-works',
  '/my-orders'
];

console.log('--- 🔍 Route Existence Audit ---');

routesToTest.forEach(route => {
  let relativePath = route === '/' ? 'page.jsx' : route.slice(1);
  let fullPath = path.join(appDir, relativePath);
  
  // Check if it's a directory with page.jsx or a page.jsx directly
  let exists = false;
  if (fs.existsSync(fullPath)) {
    if (fs.lstatSync(fullPath).isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'page.jsx'))) {
        exists = true;
      }
    } else if (fullPath.endsWith('page.jsx')) {
       exists = true;
    }
  } else if (fs.existsSync(fullPath + '.jsx')) {
     exists = true;
  }

  if (exists) {
    console.log(`✅ ${route.padEnd(20)} : EXISTS`);
  } else {
    console.log(`❌ ${route.padEnd(20)} : MISSING`);
  }
});
