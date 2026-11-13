import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callComposioMcp } from '@/lib/composio';

export async function POST(req: Request) {
  try {
    const { clientId, composioAccountId, instagramUsername, whatsappPhone, customStartDate } = await req.json();

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId es requerido' }, { status: 400 });
    }

    const db = getDb();
    const client: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);

    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    let startDate = customStartDate || client.social_start_date || new Date().toISOString().slice(0, 10);
    let initFollowers = client.initial_followers || 0;
    let initFollows = client.initial_follows || 0;
    let initMedia = client.initial_media_count || 0;
    let initBio = client.initial_bio || '';

    let accountSlug = composioAccountId || 'TND-renish-capel';
    if (accountSlug === 'instagram_yester-pyre' || accountSlug === 'SVO' || clientId === 'soc-oncologia') accountSlug = 'SVO';
    if (accountSlug === 'instagram_renish-capel') accountSlug = 'TND-renish-capel';

    // Si aún no tiene métricas iniciales registradas, tomar la foto de partida con Composio
    if (!client.initial_followers && composioAccountId) {
      try {
        const userInfoResp = await callComposioMcp('COMPOSIO_MULTI_EXECUTE_TOOL', {
          thought: `Capturar métricas base iniciales para ${client.name}`,
          tools: [{
            tool_slug: 'INSTAGRAM_GET_USER_INFO',
            account: accountSlug,
            arguments: { ig_user_id: 'me' }
          }],
          sync_response_to_workbench: false,
          memory: {}
        });
        const u = userInfoResp?.data?.results?.[0]?.response?.data || {};
        if (u.followers_count !== undefined) {
          initFollowers = u.followers_count || 0;
          initFollows = u.follows_count || 0;
          initMedia = u.media_count || 0;
          initBio = u.biography || '';
        }
      } catch (e: any) {
        console.warn('Could not take initial baseline snapshot:', e.message);
      }
    }

    db.prepare(`
      UPDATE clients 
      SET 
        composio_account_id = ?,
        instagram_username = ?,
        whatsapp_phone = ?,
        social_start_date = ?,
        initial_followers = ?,
        initial_follows = ?,
        initial_media_count = ?,
        initial_bio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      composioAccountId || null,
      instagramUsername || null,
      whatsappPhone || null,
      startDate,
      initFollowers,
      initFollows,
      initMedia,
      initBio,
      clientId
    );

    return NextResponse.json({
      success: true,
      message: 'Cuenta vinculada y métricas iniciales (línea base) registradas exitosamente',
      baseline: {
        startDate,
        initialFollowers: initFollowers,
        initialFollows: initFollows,
        initialMedia: initMedia
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
