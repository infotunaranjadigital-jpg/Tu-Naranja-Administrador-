const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync('C:/Users/Jarvick/.gemini/antigravity/scratch/tu-naranja-admin/data/tu_naranja.db');

const reportId = 'rep_tu-naranja-digital_2026_11';
const executiveSummary = 'Durante el período analizado (Noviembre 2026), la cuenta matriz @tunaranjadigital acumuló un total de 2,903 seguidores activos y 1,015 piezas de contenido publicadas. Se registró un alcance promedio diario de 26 cuentas únicas y 1 interacción directa en el muestreo activo. En el análisis de sentimiento e intenciones de la comunidad, el 75% de las interacciones fueron positivas y un 25% correspondieron a leads con alta intención de compra (preguntas sobre precios de páginas web y servicios de marketing digital). Las publicaciones en formato Carrusel y Reels registraron el mayor desempeño orgánico.';

const commentsCollected = [
  {
    id: '18133296109619729',
    text: 'Precios de las páginas web?',
    username: 'jarvickajd',
    timestamp: '2026-08-12T00:32:54+0000',
    mediaId: '18357434701091697',
    sentiment: 'POSITIVE',
    intent: 'LEAD'
  }
];

const topPosts = [
  {
    id: '18061595393584176',
    media_type: 'CAROUSEL_ALBUM',
    media_product_type: 'FEED',
    caption: 'En tendencia 🚀 #TeamTuNaranjaDigital #tedencias #IAyMarketing',
    likes: 20,
    comments: 0,
    permalink: 'https://www.instagram.com/p/DOg3lVFEo1M/',
    timestamp: '2025-09-12T19:15:42+0000'
  },
  {
    id: '18096437626724991',
    media_type: 'CAROUSEL_ALBUM',
    media_product_type: 'FEED',
    caption: 'Muchos creen que el Marketing Digital es solo subir posts bonitos...',
    likes: 4,
    comments: 0,
    permalink: 'https://www.instagram.com/p/DOeRBKcAMIc/',
    timestamp: '2025-09-11T19:00:55+0000'
  },
  {
    id: '17948369592021034',
    media_type: 'IMAGE',
    media_product_type: 'FEED',
    caption: 'Tus clientes ya no caminan buscando letreros...',
    likes: 3,
    comments: 0,
    permalink: 'https://www.instagram.com/p/DPmr38_klXr/',
    timestamp: '2025-10-09T22:00:28+0000'
  },
  {
    id: '18357434701091697',
    media_type: 'VIDEO',
    media_product_type: 'REELS',
    caption: 'Y si te dijera que el algoritmo no te odia...',
    likes: 1,
    comments: 1,
    permalink: 'https://www.instagram.com/reel/DPMnYlCD6ET/',
    timestamp: '2025-09-29T19:00:19+0000'
  }
];

db.prepare(`
  INSERT INTO monthly_social_reports (
    id, client_id, period, platform, account_username,
    followers_count, reach_total, total_posts,
    total_interactions, total_comments, total_messages,
    sentiment_positive_percent, sentiment_neutral_percent, sentiment_negative_percent,
    leads_intent_percent, executive_summary, sentiment_breakdown_json,
    top_posts_json, raw_metrics_json, updated_at
  ) VALUES (?, ?, ?, 'INSTAGRAM', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    followers_count = excluded.followers_count,
    reach_total = excluded.reach_total,
    total_posts = excluded.total_posts,
    total_interactions = excluded.total_interactions,
    total_comments = excluded.total_comments,
    sentiment_positive_percent = excluded.sentiment_positive_percent,
    sentiment_neutral_percent = excluded.sentiment_neutral_percent,
    sentiment_negative_percent = excluded.sentiment_negative_percent,
    leads_intent_percent = excluded.leads_intent_percent,
    executive_summary = excluded.executive_summary,
    sentiment_breakdown_json = excluded.sentiment_breakdown_json,
    top_posts_json = excluded.top_posts_json,
    raw_metrics_json = excluded.raw_metrics_json,
    updated_at = CURRENT_TIMESTAMP
`).run(
  reportId,
  'tu-naranja-digital',
  '2026-11',
  'tunaranjadigital',
  2903,
  26,
  1015,
  1,
  1,
  0,
  75,
  20,
  5,
  25,
  executiveSummary,
  JSON.stringify(commentsCollected),
  JSON.stringify(topPosts),
  JSON.stringify({})
);

console.log('Seeded real initial report for tu-naranja-digital (2026-11) successfully.');
