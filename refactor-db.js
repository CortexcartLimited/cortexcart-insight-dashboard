const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'src');
// Regex to find any import from '@/lib/db'
const anyDbImportRegex = /import\s+\{?[^}]*\}?\s+from\s+['"]@\/lib\/db['"];?\n?/g;
// Regex to find db.query usage
const dbUsageRegex = /db\.query\(/g;
// The single correct import statement we want everywhere
const correctImport = "import { db, pool } from '@/lib/db';";

let filesChanged = 0;

function refactorFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let needsRefactoring = dbUsageRegex.test(content);
        let needsImportFix = anyDbImportRegex.test(content) && !content.includes(correctImport);

        if (needsRefactoring || needsImportFix) {
            console.log(`[REFACTORING] ${path.relative(__dirname, filePath)}`);
            
            // 1. Replace all db.query with pool.query
            if (needsRefactoring) {
                content = content.replace(dbUsageRegex, 'pool.query(');
                console.log('   -> Replaced db.query with pool.query');
            }

            // 2. Remove ALL existing (and likely broken) imports from '@/lib/db'
            content = content.replace(anyDbImportRegex, '');

            // 3. Add the single, correct import statement at the top of the file
            content = `${correctImport}\n${content}`;
            console.log('   -> Ensured correct db/pool import.');

            fs.writeFileSync(filePath, content, 'utf8');
            filesChanged++;
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
    }
}

function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                traverseDir(fullPath);
            }
        } else {
            if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
                refactorFile(fullPath);
            }
        }
    });
}

console.log('--- Starting Database Refactoring Script (v2) ---');
traverseDir(projectDir);
console.log(`--- Finished ---`);
console.log(`✅ Total files refactored: ${filesChanged}`);
