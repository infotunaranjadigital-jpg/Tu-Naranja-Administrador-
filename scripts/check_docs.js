const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

console.log('--- ALL FORMA_LIBRE DOCUMENTS ---');
const formaLibre = db.prepare("SELECT id, doc_type, doc_number, client_id, issue_date, status, total_amount_currency FROM documents WHERE doc_type = 'FORMA_LIBRE' ORDER BY doc_number DESC").all();
console.log(formaLibre);

console.log('--- RECENT RECIBOS / ALL DOC NUMBERS AROUND 300 ---');
const near300 = db.prepare("SELECT id, doc_type, doc_number, client_id, issue_date, status, total_amount_currency FROM documents WHERE doc_number BETWEEN 295 AND 305 ORDER BY doc_number ASC").all();
console.log(near300);

console.log('--- ALL CLIENTS ---');
const clients = db.prepare("SELECT id, name, business_name, rif FROM clients").all();
console.log(clients);
