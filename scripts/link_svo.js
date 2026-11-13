const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Jarvick/.gemini/antigravity/scratch/tu-naranja-admin/data/tu_naranja.db');

db.prepare(`
  UPDATE clients SET 
    composio_account_id = 'SVO',
    instagram_username = 'svoncologia',
    initial_followers = 5359,
    initial_follows = 12,
    initial_media_count = 589,
    social_start_date = '2026-11-13'
  WHERE id = 'soc-oncologia'
`).run();

const c = db.prepare('SELECT id, name, instagram_username, initial_followers FROM clients WHERE id = ?').get('soc-oncologia');
console.log('Linked client:', c);
