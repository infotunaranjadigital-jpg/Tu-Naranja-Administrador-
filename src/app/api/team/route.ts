import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase, syncCanonicalTeam } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  syncCanonicalTeam();
  const db = getDb();

  const members = db.prepare(`
    SELECT 
      m.*,
      (SELECT COUNT(*) FROM team_payments WHERE member_id = m.id) as payments_count,
      (SELECT SUM(amount) FROM team_payments WHERE member_id = m.id AND strftime('%Y', date) = strftime('%Y', 'now')) as annual_paid
    FROM team_members m
    ORDER BY 
      CASE m.id 
        WHEN 'tm_isabelle' THEN 1
        WHEN 'tm_angie' THEN 2
        WHEN 'tm_adis' THEN 3
        WHEN 'tm_mariana' THEN 4
        WHEN 'tm_eleonora' THEN 5
        ELSE 6
      END ASC
  `).all();

  const recentPayments = db.prepare(`
    SELECT p.*, m.name as member_name, m.payment_method as preferred_payment_method
    FROM team_payments p
    JOIN team_members m ON p.member_id = m.id
    ORDER BY p.date DESC LIMIT 50
  `).all();

  // Evaluaciones de diseñadoras (Adis y Mariana)
  const designerEvaluations = db.prepare(`
    SELECT * FROM designer_evaluations
    ORDER BY week_start_date ASC, designer_name ASC
  `).all() as any[];

  // Estadísticas acumuladas de diseñadoras (Adis vs Mariana)
  const adisEvals = designerEvaluations.filter(e => e.member_id === 'tm_adis' || (e.designer_name || '').toLowerCase().includes('adis'));
  const marianaEvals = designerEvaluations.filter(e => e.member_id === 'tm_mariana' || (e.designer_name || '').toLowerCase().includes('mariana'));

  const computeStats = (evals: any[], name: string, memberId: string) => {
    let totalPieces = 0;
    let staticPosts = 0;
    let reels = 0;
    let carousels = 0;
    let extraWorks = 0;
    let returnedPieces = 0;

    for (const e of evals) {
      totalPieces += (Number(e.total_pieces) || 0);
      staticPosts += (Number(e.static_posts_count) || 0);
      reels += (Number(e.reels_count) || 0);
      carousels += (Number(e.carousels_count) || 0);
      extraWorks += (Number(e.extra_works_count) || 0);
      returnedPieces += (Number(e.returned_pieces_count) || 0);
    }

    const correctPieces = Math.max(0, totalPieces - returnedPieces);
    const cleanRatePercent = totalPieces > 0 ? Number(((correctPieces / totalPieces) * 100).toFixed(1)) : 100;
    const globalErrorRate = totalPieces > 0 ? Number(((returnedPieces / totalPieces) * 100).toFixed(1)) : 0;

    return {
      name,
      memberId,
      totalPieces,
      staticPosts,
      reels,
      carousels,
      extraWorks,
      returnedPieces,
      correctPieces,
      cleanRatePercent,
      globalErrorRate,
      evalsCount: evals.length
    };
  };

  const adisStats = computeStats(adisEvals, 'Adis', 'tm_adis');
  const marianaStats = computeStats(marianaEvals, 'Mariana', 'tm_mariana');

  // Serie semanal comparativa para el gráfico dinámico
  const weeksMap: Record<string, any> = {};
  for (const e of designerEvaluations) {
    const key = e.week_start_date;
    if (!weeksMap[key]) {
      weeksMap[key] = {
        week_start_date: e.week_start_date,
        week_label: e.week_label,
        adis: { total: 0, returned: 0, correct: 0, cleanRate: 100, errorRate: 0, static: 0, reels: 0, carousels: 0, extra: 0, clients: [], reasons: '', feedback: '' },
        mariana: { total: 0, returned: 0, correct: 0, cleanRate: 100, errorRate: 0, static: 0, reels: 0, carousels: 0, extra: 0, clients: [], reasons: '', feedback: '' }
      };
    }
    const isAdis = e.member_id === 'tm_adis' || (e.designer_name || '').toLowerCase().includes('adis');
    const target = isAdis ? weeksMap[key].adis : weeksMap[key].mariana;
    target.total = Number(e.total_pieces) || 0;
    target.returned = Number(e.returned_pieces_count) || 0;
    target.correct = Number(e.approved_first_time_count) || Math.max(0, target.total - target.returned);
    target.cleanRate = target.total > 0 ? Number(((target.correct / target.total) * 100).toFixed(1)) : 100;
    target.errorRate = Number(e.error_rate_percent) || 0;
    target.static = Number(e.static_posts_count) || 0;
    target.reels = Number(e.reels_count) || 0;
    target.carousels = Number(e.carousels_count) || 0;
    target.extra = Number(e.extra_works_count) || 0;
    target.reasons = e.correction_reasons;
    target.feedback = e.feedback_notes;
    try {
      target.clients = JSON.parse(e.clients_worked || '[]');
    } catch {
      target.clients = (e.clients_worked || '').split(',').map((s: string) => s.trim());
    }
  }

  const weeklyComparisonSeries = Object.values(weeksMap).sort((a: any, b: any) => a.week_start_date.localeCompare(b.week_start_date));

  // Diagnóstico comparativo
  const totalTeamPieces = adisStats.totalPieces + marianaStats.totalPieces;
  const totalTeamReturned = adisStats.returnedPieces + marianaStats.returnedPieces;
  const totalTeamCorrect = adisStats.correctPieces + marianaStats.correctPieces;

  const designerComparison = {
    adis: adisStats,
    mariana: marianaStats,
    mostReturned: adisStats.returnedPieces > marianaStats.returnedPieces ? 'Adis' : (marianaStats.returnedPieces > adisStats.returnedPieces ? 'Mariana' : 'Empate'),
    highestErrorRate: adisStats.globalErrorRate > marianaStats.globalErrorRate ? 'Adis' : (marianaStats.globalErrorRate > adisStats.globalErrorRate ? 'Mariana' : 'Empate'),
    mostCleanAccurate: adisStats.cleanRatePercent > marianaStats.cleanRatePercent ? 'Adis' : (marianaStats.cleanRatePercent > adisStats.cleanRatePercent ? 'Mariana' : 'Empate'),
    totalTeamPieces,
    totalTeamReturned,
    totalTeamCorrect,
    teamAverageErrorRate: totalTeamPieces > 0 ? Number(((totalTeamReturned / totalTeamPieces) * 100).toFixed(1)) : 0,
    teamCleanRate: totalTeamPieces > 0 ? Number(((totalTeamCorrect / totalTeamPieces) * 100).toFixed(1)) : 100
  };

  // Evaluaciones generales de colaboradores
  const memberEvaluations = db.prepare('SELECT * FROM member_evaluations ORDER BY evaluation_date DESC').all();

  return NextResponse.json({
    members,
    recentPayments,
    designerEvaluations,
    designerStats: {
      adis: adisStats,
      mariana: marianaStats,
      comparison: designerComparison
    },
    weeklyComparisonSeries,
    memberEvaluations
  });
}

export async function POST(req: Request) {
  seedDatabase();
  const apiKey = req.headers.get('x-api-key');
  const user = await getCurrentUser();

  if (!validateApiKey(apiKey) && !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const db = getDb();

    if (data.action === 'CREATE_MEMBER') {
      const { name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes } = data;
      const id = 'tm_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_members (id, name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run(
        id, 
        name, 
        role, 
        Number(monthly_salary) || 0, 
        payment_method || 'PAGO_MOVIL', 
        payment_frequency || 'QUINCENAL', 
        rate_rule || 'BCV', 
        incentive_rule || '', 
        notes || ''
      );
      const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
      return NextResponse.json({ success: true, member: created });
    }

    if (data.action === 'UPDATE_MEMBER') {
      const { id, name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes, active } = data;
      const stmt = db.prepare(`
        UPDATE team_members SET
          name = COALESCE(?, name),
          role = COALESCE(?, role),
          monthly_salary = COALESCE(?, monthly_salary),
          payment_method = COALESCE(?, payment_method),
          payment_frequency = COALESCE(?, payment_frequency),
          rate_rule = COALESCE(?, rate_rule),
          incentive_rule = COALESCE(?, incentive_rule),
          notes = COALESCE(?, notes),
          active = COALESCE(?, active)
        WHERE id = ?
      `);
      stmt.run(
        name, 
        role, 
        monthly_salary !== undefined ? Number(monthly_salary) : null, 
        payment_method, 
        payment_frequency, 
        rate_rule, 
        incentive_rule, 
        notes, 
        active !== undefined ? (active ? 1 : 0) : null,
        id
      );
      const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
      return NextResponse.json({ success: true, member: updated });
    }

    if (data.action === 'DELETE_MEMBER') {
      const { id } = data;
      db.prepare('DELETE FROM team_payments WHERE member_id = ?').run(id);
      db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
      return NextResponse.json({ success: true, message: 'Colaborador eliminado' });
    }

    if (data.action === 'RESET_CANONICAL') {
      syncCanonicalTeam();
      return NextResponse.json({ success: true, message: 'Equipo restablecido con los 5 integrantes canónicos' });
    }

    if (data.action === 'RECORD_PAYMENT') {
      const { member_id, date, period, amount, currency = 'USD', rate_type, rate_applied, amount_bs, payment_method, reference, notes } = data;
      const id = 'pay_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_payments (id, member_id, date, period, amount, currency, rate_type, rate_applied, amount_bs, payment_method, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, 
        member_id, 
        date || new Date().toISOString().split('T')[0], 
        period, 
        Number(amount), 
        currency, 
        rate_type || 'BCV', 
        Number(rate_applied) || null, 
        Number(amount_bs) || null, 
        payment_method, 
        reference || '', 
        notes || ''
      );
      const created = db.prepare('SELECT * FROM team_payments WHERE id = ?').get(id);
      return NextResponse.json({ success: true, payment: created });
    }

    if (data.action === 'UPDATE_MEMBER_SKILLS') {
      const { member_id, soft_skills, hard_skills, bio } = data;
      const stmt = db.prepare(`
        UPDATE team_members SET
          soft_skills = COALESCE(?, soft_skills),
          hard_skills = COALESCE(?, hard_skills),
          bio = COALESCE(?, bio)
        WHERE id = ?
      `);
      stmt.run(
        typeof soft_skills === 'object' ? JSON.stringify(soft_skills) : (soft_skills || null),
        typeof hard_skills === 'object' ? JSON.stringify(hard_skills) : (hard_skills || null),
        bio || null,
        member_id
      );
      const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(member_id);
      return NextResponse.json({ success: true, member: updated });
    }

    if (data.action === 'RECORD_DESIGNER_EVALUATION') {
      const {
        member_id, designer_name, week_start_date, week_label,
        clients_worked, static_posts_count, reels_count, carousels_count,
        extra_works_count, returned_pieces_count, correction_reasons, feedback_notes
      } = data;

      const staticPosts = Number(static_posts_count) || 0;
      const reels = Number(reels_count) || 0;
      const carousels = Number(carousels_count) || 0;
      const extra = Number(extra_works_count) || 0;
      const returned = Number(returned_pieces_count) || 0;
      const total = staticPosts + reels + carousels + extra;
      const correct = Math.max(0, total - returned);
      const cleanRate = total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 100;
      const errorRate = total > 0 ? Number(((returned / total) * 100).toFixed(1)) : 0;
      const id = 'eval_' + Date.now();

      const stmt = db.prepare(`
        INSERT INTO designer_evaluations (
          id, member_id, designer_name, week_start_date, week_label,
          clients_worked, static_posts_count, reels_count, carousels_count,
          extra_works_count, total_pieces, returned_pieces_count,
          approved_first_time_count, clean_rate_percent,
          error_rate_percent, correction_reasons, feedback_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, 
        member_id, 
        designer_name, 
        week_start_date, 
        week_label || `Semana del ${week_start_date}`,
        typeof clients_worked === 'object' ? JSON.stringify(clients_worked) : (clients_worked || '[]'),
        staticPosts, reels, carousels, extra, total, returned,
        correct, cleanRate,
        errorRate, correction_reasons || '', feedback_notes || ''
      );

      return NextResponse.json({ success: true, evaluationId: id });
    }

    if (data.action === 'SYNC_TRELLO_DESIGN') {
      const apiKey = process.env.TRELLO_API_KEY || '80743f45d7ed829f27e4d43d230a7ddf';
      const token = process.env.TRELLO_TOKEN || 'ATTAcafd3daa843d855b894b21fed413734d19e05a435c9f22913c80389aac2dda519D84274C';
      const boardId = '5d18f813e1333f61f540e8a9'; // Departamento de Diseño

      const [listsRes, membersRes, cardsRes] = await Promise.all([
        fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${apiKey}&token=${token}`).then(r => r.json()),
        fetch(`https://api.trello.com/1/boards/${boardId}/members?key=${apiKey}&token=${token}`).then(r => r.json()),
        fetch(`https://api.trello.com/1/boards/${boardId}/cards?key=${apiKey}&token=${token}&fields=name,idList,labels,idMembers,dateLastActivity`).then(r => r.json())
      ]);

      function normalizeUnicode(t: string) {
        if (!t) return '';
        return t
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
            const code = char.codePointAt(0)!;
            if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(code - 0x1D400 + 65);
            if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(code - 0x1D41A + 97);
            if (code >= 0x1D5D4 && code <= 0x1D5ED) return String.fromCharCode(code - 0x1D5D4 + 65);
            if (code >= 0x1D5EE && code <= 0x1D607) return String.fromCharCode(code - 0x1D5EE + 97);
            return char;
          })
          .toLowerCase()
          .trim();
      }

      function parsePieces(title: string) {
        const norm = normalizeUnicode(title);
        const postMatch = norm.match(/(\d+)\s*post/);
        const posts = postMatch ? parseInt(postMatch[1], 10) : (norm.includes('post') ? 1 : 0);
        const storyMatch = norm.match(/(\d+)\s*historia/);
        const stories = storyMatch ? parseInt(storyMatch[1], 10) : (norm.includes('historia') ? 1 : 0);
        const reelMatch = norm.match(/(\d+)\s*reel/);
        const reels = reelMatch ? parseInt(reelMatch[1], 10) : (norm.includes('reel') ? 1 : 0);

        let corrections = 0;
        const corrPostMatch = norm.match(/(\d+)\s*post\s*(?:con\s*)?correcci/);
        const corrStoryMatch = norm.match(/(\d+)\s*historia\s*(?:con\s*)?correcci/);
        const corrGeneralMatch = norm.match(/(\d+)\s*correcci/);

        if (corrPostMatch || corrStoryMatch) {
          if (corrPostMatch) corrections += parseInt(corrPostMatch[1], 10);
          if (corrStoryMatch) corrections += parseInt(corrStoryMatch[1], 10);
        } else if (corrGeneralMatch) {
          corrections = parseInt(corrGeneralMatch[1], 10);
        } else if (norm.includes('con correccion') || norm.includes('con correcciones') || norm.includes('tiene correciones')) {
          corrections = 1;
        }

        const totalPieces = posts + stories + reels;
        return {
          posts,
          stories,
          reels,
          totalPieces: totalPieces > 0 ? totalPieces : 1,
          corrections
        };
      }

      function getMondayOfDate(d: string | Date) {
        const date = new Date(d);
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().slice(0, 10);
      }

      function extractDate(title: string, due?: string, lastAct?: string) {
        const norm = normalizeUnicode(title);
        const monthMap: Record<string, string> = { 'octubre': '10', 'noviembre': '11', 'diciembre': '12', 'enero': '01' };
        
        // 1. vence DD de MMMM
        const venceMatch = norm.match(/vence\s+(\d{1,2})\s+de\s+(octubre|noviembre|diciembre)/);
        if (venceMatch) {
          const day = venceMatch[1].padStart(2, '0');
          const month = monthMap[venceMatch[2]] || '10';
          return getMondayOfDate(`2026-${month}-${day}T12:00:00Z`);
        }

        // 2. meta DD de MMMM
        const metaMatch = norm.match(/meta\s+(\d{1,2})\s+de\s+(octubre|noviembre|diciembre)/);
        if (metaMatch) {
          const day = metaMatch[1].padStart(2, '0');
          const month = monthMap[metaMatch[2]] || '10';
          return getMondayOfDate(`2026-${month}-${day}T12:00:00Z`);
        }

        if (due) return getMondayOfDate(due);
        if (lastAct) return getMondayOfDate(lastAct);
        return '2026-10-26';
      }

      const memberMap: Record<string, string> = {};
      for (const m of (membersRes || [])) {
        memberMap[m.id] = (m.fullName || m.username || '').toLowerCase();
      }

      const targetListIds = new Set<string>();
      for (const l of (listsRes || [])) {
        const norm = normalizeUnicode(l.name);
        if (norm.includes('finalizado') || norm.includes('revisando cliente') || norm.includes('programacion')) {
          targetListIds.add(l.id);
        }
      }

      // Agrupación estricta por semana de trabajo (Lunes a Lunes)
      interface WeeklyStat {
        designer: 'Adis' | 'Mariana';
        monday: string;
        total: number;
        posts: number;
        stories: number;
        reels: number;
        returned: number;
        clients: Set<string>;
      }

      const weeklyMap: Record<string, WeeklyStat> = {};

      for (const c of (cardsRes || [])) {
        if (!targetListIds.has(c.idList)) continue;
        const normName = normalizeUnicode(c.name);
        if (
          normName.startsWith('actividades finalizadas') || 
          normName.startsWith('urgentes') || 
          normName.startsWith('pasada') || 
          normName.startsWith('actual') || 
          normName.startsWith('instagram') || 
          normName.startsWith('revision de clientes') || 
          normName.startsWith('otras cosas')
        ) {
          continue;
        }

        const assigned: string[] = (c.idMembers || []).map((mid: string) => memberMap[mid] || '');
        const isAdis = assigned.some((a: string) => a.includes('adisney') || a.includes('adis'));
        const isMariana = assigned.some((a: string) => a.includes('marianna') || a.includes('mariana'));
        if (!isAdis && !isMariana) continue;

        const designer = isAdis ? 'Adis' : 'Mariana';
        const monday = extractDate(c.name, c.due, c.dateLastActivity);
        const key = `${designer}_${monday}`;

        if (!weeklyMap[key]) {
          weeklyMap[key] = {
            designer,
            monday,
            total: 0,
            posts: 0,
            stories: 0,
            reels: 0,
            returned: 0,
            clients: new Set<string>()
          };
        }

        const p = parsePieces(c.name);
        weeklyMap[key].total += p.totalPieces;
        weeklyMap[key].posts += p.posts;
        weeklyMap[key].stories += p.stories;
        weeklyMap[key].reels += p.reels;
        weeklyMap[key].returned += p.corrections;

        const cleanClient = normalizeUnicode(c.name)
          .split(/[0-9\/\-\(\[\+]/)[0]
          .replace(/[\u{1D400}-\u{1D7FF}]/gu, '')
          .trim();
        if (cleanClient && cleanClient.length > 2) {
          const capitalized = cleanClient.charAt(0).toUpperCase() + cleanClient.slice(1);
          weeklyMap[key].clients.add(capitalized);
        }
      }

      const upsertStmt = db.prepare(`
        INSERT OR REPLACE INTO designer_evaluations (
          id, member_id, designer_name, week_start_date, week_label,
          clients_worked, static_posts_count, reels_count, carousels_count,
          extra_works_count, total_pieces, returned_pieces_count,
          approved_first_time_count, clean_rate_percent,
          error_rate_percent, correction_reasons, feedback_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const weeksProcessed: any[] = [];

      for (const key of Object.keys(weeklyMap).sort()) {
        const item = weeklyMap[key];
        const correct = Math.max(0, item.total - item.returned);
        const cleanRate = item.total > 0 ? Number(((correct / item.total) * 100).toFixed(1)) : 100;
        const errorRate = item.total > 0 ? Number(((item.returned / item.total) * 100).toFixed(1)) : 0;
        const memberId = item.designer === 'Adis' ? 'tm_adis' : 'tm_mariana';
        const evalId = `eval_trello_${item.designer.toLowerCase()}_${item.monday}`;
        const weekLabel = `Semana del ${item.monday}`;

        upsertStmt.run(
          evalId, memberId, item.designer, item.monday, weekLabel,
          JSON.stringify(Array.from(item.clients)),
          item.posts, item.reels, item.stories, 0,
          item.total, item.returned, correct, cleanRate,
          errorRate,
          `Auditoría Trello: ${item.returned} piezas con corrección en listas Finalizado/Programado/Revisando.`,
          `${item.designer} entregó ${correct} de ${item.total} piezas 100% bien (${cleanRate}% efectividad limpia).`
        );

        weeksProcessed.push({
          evalId,
          designer: item.designer,
          monday: item.monday,
          total: item.total,
          correct,
          returned: item.returned,
          cleanRate,
          errorRate,
          clients: Array.from(item.clients)
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Tablero de Diseño de Trello sincronizado por semanas de trabajo (~50 piezas/semana)',
        weeksCount: weeksProcessed.length,
        weeks: weeksProcessed
      });
    }

    if (data.action === 'RECORD_MEMBER_EVALUATION') {
      const { member_id, evaluation_date, period, overall_score, strengths, improvements, notes } = data;
      const id = 'meval_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO member_evaluations (id, member_id, evaluation_date, period, overall_score, strengths, improvements, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, member_id, evaluation_date || new Date().toISOString().split('T')[0],
        period || 'Evaluación Mensual', Number(overall_score) || 10,
        strengths || '', improvements || '', notes || ''
      );
      return NextResponse.json({ success: true, evaluationId: id });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
