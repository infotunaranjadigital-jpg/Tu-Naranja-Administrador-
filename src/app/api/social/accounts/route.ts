import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listConnectedAccounts } from '@/lib/composio';

export async function GET() {
  try {
    const db = getDb();
    const clients = db.prepare(`
      SELECT 
        id, name, composio_account_id, instagram_username, 
        whatsapp_phone, social_start_date, initial_followers, 
        initial_follows, initial_media_count, initial_bio
      FROM clients 
      WHERE active = 1
    `).all();
    
    let composioAccounts = { instagram: [], whatsapp: [], allInstagram: [], allWhatsapp: [] };
    try {
      composioAccounts = await listConnectedAccounts();
    } catch (e: any) {
      console.warn('Could not fetch Composio accounts:', e.message);
    }

    return NextResponse.json({
      success: true,
      clients,
      composioAccounts
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
