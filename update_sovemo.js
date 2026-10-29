const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Jarvick/.gemini/antigravity/scratch/tu-naranja-admin/data/tu_naranja.db');

const rate = 888.12;
const total = 660;
const subtotalBs = Number((total * rate).toFixed(2));
const items = [
  { description: 'Cobertura presencial evento médico SOVEMO (2 días)', category: 'GRABACIONES', unit: 'Jornada', quantity: 2, amount: 460 },
  { description: 'Pauta publicitaria y difusión digital (2 días)', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 200 }
];

db.prepare(`
  UPDATE documents
  SET client_id = 'sovemo',
      total_amount_currency = ?,
      subtotal_bs = ?,
      total_bs_applied = ?,
      base_bs_bcv = ?,
      base_usd_bcv = ?,
      items_json = ?,
      notes = 'Cobertura presencial y pauta de 2 días SOVEMO ($660)'
  WHERE id = 'doc_2026_10_05'
`).run(total, subtotalBs, subtotalBs, subtotalBs, total, JSON.stringify(items));

console.log('Updated in DB:', db.prepare('SELECT id, client_id, total_amount_currency, items_json FROM documents WHERE id = ?').get('doc_2026_10_05'));
