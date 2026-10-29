const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Jarvick/.gemini/antigravity/scratch/tu-naranja-admin/data/tu_naranja.db');

db.prepare(`
  UPDATE clients
  SET preferred_document = 'FORMA_LIBRE',
      notes = 'Factura fiscal Forma Libre (+16% IVA). Retención SENIAT opcional/por confirmar.'
  WHERE id IN ('soc-oncologia', 'soc-mastologia')
`).run();

const rows = db.prepare(`SELECT id, name, preferred_document, notes FROM clients WHERE id IN ('soc-oncologia', 'soc-mastologia')`).all();
console.log('Updated clients:', rows);
