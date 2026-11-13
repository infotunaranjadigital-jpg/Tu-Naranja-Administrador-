const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'tu_naranja.db'));

console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='documents'").get().sql);
const docs = db.prepare(`SELECT * FROM documents WHERE client_id = 'cc-garcia' ORDER BY issue_date DESC LIMIT 5`).all();
console.log('DOCS:', JSON.stringify(docs, null, 2));
