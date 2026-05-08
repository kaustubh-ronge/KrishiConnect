const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// recursively get all .js and .jsx files
function getAllFiles(dir, files = []) {
  if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git')) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(projectRoot);

const results = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find imports
  const importRegex = /import\s+({[^}]+}|[^{}\n;]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importClause = match[1];
    
    // clean up comments, newlines
    importClause = importClause.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').replace(/\n/g, ' ');
    
    if (importClause.includes('{')) {
       // destructuring
       const vars = importClause.replace(/[{}]/g, '').split(',').map(v => v.trim()).filter(Boolean);
       for (const v of vars) {
          const varName = v.includes(' as ') ? v.split(' as ')[1].trim() : v;
          const occurrences = content.match(new RegExp(`\\b${varName}\\b`, 'g'));
          if (occurrences && occurrences.length === 1) {
             results.push(`Unused import: ${varName} in ${file.replace(projectRoot, '')}`);
          }
       }
    } else {
       // default import
       const varName = importClause.trim();
       const occurrences = content.match(new RegExp(`\\b${varName}\\b`, 'g'));
       if (occurrences && occurrences.length === 1) {
           results.push(`Unused import: ${varName} in ${file.replace(projectRoot, '')}`);
       }
    }
  }
}

fs.writeFileSync(path.join(projectRoot, 'scratch', 'audit_results.txt'), results.join('\n'));
console.log('Audit complete. Found ' + results.length + ' potential unused imports.');
