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
        adis: { total: 0, returned: 0, errorRate: 0, static: 0, reels: 0, carousels: 0, extra: 0, clients: [], reasons: '', feedback: '' },
        mariana: { total: 0, returned: 0, errorRate: 0, static: 0, reels: 0, carousels: 0, extra: 0, clients: [], reasons: '', feedback: '' }
      };
    }
    const isAdis = e.member_id === 'tm_adis' || (e.designer_name || '').toLowerCase().includes('adis');
    const target = isAdis ? weeksMap[key].adis : weeksMap[key].mariana;
    target.total = Number(e.total_pieces) || 0;
    target.returned = Number(e.returned_pieces_count) || 0;
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
  const designerComparison = {
    adis: adisStats,
    mariana: marianaStats,
    mostReturned: adisStats.returnedPieces > marianaStats.returnedPieces ? 'Adis' : (marianaStats.returnedPieces > adisStats.returnedPieces ? 'Mariana' : 'Empate'),
    highestErrorRate: adisStats.globalErrorRate > marianaStats.globalErrorRate ? 'Adis' : (marianaStats.globalErrorRate > adisStats.globalErrorRate ? 'Mariana' : 'Empate'),
    totalTeamPieces: adisStats.totalPieces + marianaStats.totalPieces,
    totalTeamReturned: adisStats.returnedPieces + marianaStats.returnedPieces,
    teamAverageErrorRate: (adisStats.totalPieces + marianaStats.totalPieces) > 0 
      ? Number((((adisStats.returnedPieces + marianaStats.returnedPieces) / (adisStats.totalPieces + marianaStats.totalPieces)) * 100).toFixed(1))
      : 0
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
      const errorRate = total > 0 ? Number(((returned / total) * 100).toFixed(1)) : 0;
      const id = 'eval_' + Date.now();

      const stmt = db.prepare(`
        INSERT INTO designer_evaluations (
          id, member_id, designer_name, week_start_date, week_label,
          clients_worked, static_posts_count, reels_count, carousels_count,
          extra_works_count, total_pieces, returned_pieces_count,
          error_rate_percent, correction_reasons, feedback_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, 
        member_id, 
        designer_name, 
        week_start_date, 
        week_label || `Semana del ${week_start_date}`,
        typeof clients_worked === 'object' ? JSON.stringify(clients_worked) : (clients_worked || '[]'),
        staticPosts, reels, carousels, extra, total, returned,
        errorRate, correction_reasons || '', feedback_notes || ''
      );

      return NextResponse.json({ success: true, evaluationId: id });
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
