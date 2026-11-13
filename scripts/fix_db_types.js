const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');
let code = fs.readFileSync(filePath, 'utf8');
code = code.replace(/\r\n/g, '\n');

const old1 = `    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_forma_libre_number');
    if (!row || parseInt(row.value, 10) < 299) {`;

const new1 = `    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_forma_libre_number') as { value?: string } | undefined;
    if (!row || !row.value || parseInt(String(row.value), 10) < 299) {`;

code = code.replace(old1, new1);

const old2 = `    const maxDoc = db.prepare(\`SELECT MAX(doc_number) as max_num FROM documents WHERE doc_type = 'FORMA_LIBRE'\`).get();
    if (maxDoc && maxDoc.max_num) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', maxDoc.max_num.toString());
    }`;

const new2 = `    const maxDoc = db.prepare(\`SELECT MAX(doc_number) as max_num FROM documents WHERE doc_type = 'FORMA_LIBRE'\`).get() as { max_num?: number } | undefined;
    if (maxDoc && maxDoc.max_num) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', String(maxDoc.max_num));
    }`;

code = code.replace(old2, new2);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed types in db.ts');
