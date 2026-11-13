import { NextRequest, NextResponse } from 'next/server';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY || '80743f45d7ed829f27e4d43d230a7ddf';
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || 'ATTAcafd3daa843d855b894b21fed413734d19e05a435c9f22913c80389aac2dda519D84274C';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const attachmentUrl = searchParams.get('url');

    let downloadUrl = attachmentUrl;

    if (cardId && !downloadUrl) {
      // Fetch card attachments from Trello API
      const cardRes = await fetch(
        `https://api.trello.com/1/cards/${encodeURIComponent(cardId)}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&attachments=true`
      );
      if (!cardRes.ok) {
        return NextResponse.json({ error: `Card not found: ${cardRes.statusText}` }, { status: 404 });
      }
      const cardData = await cardRes.json();
      const attachments = cardData.attachments || [];
      if (attachments.length === 0) {
        return NextResponse.json({ error: 'No attachments found on this card' }, { status: 404 });
      }
      // Use the first attachment download URL
      downloadUrl = attachments[0].url;
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Missing cardId or url parameter' }, { status: 400 });
    }

    // Fetch the raw attachment binary with Trello auth
    const mediaRes = await fetch(downloadUrl, {
      headers: {
        Authorization: `OAuth oauth_consumer_key="${TRELLO_API_KEY}", oauth_token="${TRELLO_TOKEN}"`,
      },
    });

    if (!mediaRes.ok) {
      return NextResponse.json(
        { error: `Failed to download media from Trello: ${mediaRes.statusText}` },
        { status: mediaRes.status }
      );
    }

    const contentType = mediaRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await mediaRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('Error in media-proxy:', error);
    return NextResponse.json({ error: error.message || 'Internal proxy error' }, { status: 500 });
  }
}
