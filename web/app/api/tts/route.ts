import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'edge-tts-universal';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice') || 'pt-BR-AntonioNeural';

    if (!text) {
        return new NextResponse('Text is required', { status: 400 });
    }

    try {
        const tts = new EdgeTTS(text, voice);
        const result = await tts.synthesize();
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error: any) {
        console.error('Edge TTS Error:', error);
        return new NextResponse(error.message || 'Error generating audio', { status: 500 });
    }
}
