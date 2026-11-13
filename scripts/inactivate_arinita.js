const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(process.cwd(), 'data', 'tu_naranja.db'));
db.exec("UPDATE clients SET active = 0 WHERE id = 'arinita'");
console.log('Arinita status now:', db.prepare("SELECT id, name, active FROM clients WHERE id = 'arinita'").get());
