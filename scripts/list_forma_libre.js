const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

const docs = db.prepare(`
  SELECT doc_number, doc_type, client_id, control_number, total_amount_currency, currency, total_bs_applied, issue_date, notes
  FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' 
  ORDER BY doc_number DESC 
  LIMIT 10
`).all();

console.log(JSON.stringify(docs, null, 2));

const settings = db.prepare("SELECT * FROM settings WHERE key LIKE '%forma%'").all();
console.log('Settings:', settings);
