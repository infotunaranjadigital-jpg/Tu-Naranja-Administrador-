const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'tu_naranja.db'));

console.log('CLIENTS SCHEMA:');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='clients'").get().sql);

const clients = db.prepare("SELECT * FROM clients WHERE name LIKE '%Ceramico%' OR name LIKE '%Feminaid%'").all();
console.log('CLIENTS:', JSON.stringify(clients, null, 2));

const rates = db.prepare('SELECT * FROM rates ORDER BY date DESC LIMIT 5').all();
console.log('RATES:', JSON.stringify(rates, null, 2));

const prevDocs = db.prepare("SELECT * FROM documents WHERE client_id LIKE '%ceramico%' OR client_name LIKE '%ceramico%' ORDER BY issue_date DESC LIMIT 3").all();
console.log('PREV DOCS CERAMICO:', JSON.stringify(prevDocs, null, 2));
