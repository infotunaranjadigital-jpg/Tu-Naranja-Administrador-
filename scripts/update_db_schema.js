const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

const targetStr = `  try {
    db.exec(\`UPDATE clients SET base_monthly_fee = 250.0 WHERE id = 'dra-dama'\`);
  } catch {}
}`;

const replacementStr = `  try {
    db.exec(\`UPDATE clients SET base_monthly_fee = 250.0 WHERE id = 'dra-dama'\`);
  } catch {}

  // Soporte para número de control pre-impreso y arranque en 300
  try {
    db.exec(\`ALTER TABLE documents ADD COLUMN control_number TEXT\`);
  } catch {}
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_forma_libre_number');
    if (!row || parseInt(row.value, 10) < 299) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '299');
    }
  } catch {}
  try {
    db.exec(\`
      UPDATE documents 
      SET doc_number = 300 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND issue_date >= '2026-11-01' 
        AND doc_number IN (298, 299);
    \`);
    const maxDoc = db.prepare(\`SELECT MAX(doc_number) as max_num FROM documents WHERE doc_type = 'FORMA_LIBRE'\`).get();
    if (maxDoc && maxDoc.max_num) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', maxDoc.max_num.toString());
    }
  } catch {}
}`;

// Normalize line endings to match file
if (content.includes('\r\n')) {
  const targetCRLF = targetStr.replace(/\n/g, '\r\n');
  const replacementCRLF = replacementStr.replace(/\n/g, '\r\n');
  content = content.replace(targetCRLF, replacementCRLF);
} else {
  content = content.replace(targetStr, replacementStr);
}

fs.writeFileSync('src/lib/db.ts', content, 'utf8');
console.log('src/lib/db.ts updated successfully');
