import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cardSchema = {
    type: Type.OBJECT,
    properties: {
        cards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    detailed_analysis: { type: Type.STRING },
                    theme: { type: Type.STRING, enum: ['energy', 'warning', 'focus'] }
                },
                required: ['id', 'title', 'summary', 'detailed_analysis', 'theme']
            }
        }
    },
    required: ['cards']
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawBirthDate = searchParams.get('birthDate'); // YYYY-MM-DD
        const rawBirthTime = searchParams.get('birthTime'); // HH:mm
        const rawBirthCity = searchParams.get('birthCity'); // e.g. "São Paulo, SP, Brasil"

        const today = new Date().toISOString();
        const todayFormatted = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Build natal profile context string
        let zodiacNote = 'Dados natais não fornecidos pelo usuário.';
        if (rawBirthDate) {
            const bd = new Date(rawBirthDate + 'T12:00:00');
            const birthDateDisplay = bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const month = bd.getMonth() + 1;
            const day = bd.getDate();
            const zodiac =
                (month === 3 && day >= 21) || (month === 4 && day <= 19) ? 'Áries ♈' :
                (month === 4 && day >= 20) || (month === 5 && day <= 20) ? 'Touro ♉' :
                (month === 5 && day >= 21) || (month === 6 && day <= 20) ? 'Gêmeos ♊' :
                (month === 6 && day >= 21) || (month === 7 && day <= 22) ? 'Câncer ♋' :
                (month === 7 && day >= 23) || (month === 8 && day <= 22) ? 'Leão ♌' :
                (month === 8 && day >= 23) || (month === 9 && day <= 22) ? 'Virgem ♍' :
                (month === 9 && day >= 23) || (month === 10 && day <= 22) ? 'Libra ♎' :
                (month === 10 && day >= 23) || (month === 11 && day <= 21) ? 'Escorpião ♏' :
                (month === 11 && day >= 22) || (month === 12 && day <= 21) ? 'Sagitário ♐' :
                (month === 12 && day >= 22) || (month === 1 && day <= 19) ? 'Capricórnio ♑' :
                (month === 1 && day >= 20) || (month === 2 && day <= 18) ? 'Aquário ♒' : 'Peixes ♓';
            const parts = [`Sol em ${zodiac} | Data: ${birthDateDisplay}`];
            if (rawBirthTime) parts.push(`Hora natal: ${rawBirthTime} (crucial para Ascendente e Cúspides das Casas)`);
            if (rawBirthCity) parts.push(`Cidade natal: ${rawBirthCity} (crucial para Ascendente e posição geográfica)`);
            zodiacNote = parts.join(' | ');
        }

        const systemPrompt = `You are the Guia Astro-Analítico, a rational mystic who crosses astrological archetypes with psychological frameworks to produce highly practical daily guidance.

User natal data: ${zodiacNote}

Today's date: ${todayFormatted} (ISO: ${today})

Your mission: Cross-reference the user's complete natal chart (using birth date, time, and location when provided) with the current astrological season and planetary transits for today. When birth time is provided, consider the Ascendant archetype. When birth city is provided, consider geographic positioning.

Generate exactly 5 insight cards in valid JSON. Each card must be:
- Extremely practical and grounded — no vague platitudes
- Written in Brazilian Portuguese
- Actionable, with a clear behavioral suggestion

Card categories to cover:
1. Foco do Dia (focus) — what cognitive/creative domain deserves energy today
2. Energia Criativa (energy) — what type of creative output flows most naturally today
3. Atenção Tática (warning) — what behavioral pitfall or energetic drain to watch for
4. Relacionamentos & Comunicação (focus) — interpersonal energy quality today
5. Virada Interior (energy) — one deep inner theme or pattern activated by today's sky

For detailed_analysis, write 3-4 sentences with specific psychological + astrological reasoning. Do NOT use generic horoscope language.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: 'Generate my astro-analytical daily dashboard for today.' }] }],
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: cardSchema,
                temperature: 0.85
            }
        });

        const parsed = JSON.parse(response.text || '{}');

        return NextResponse.json({
            ...parsed,
            generated_at: today,
            date_key: new Date().toISOString().split('T')[0]
        });

    } catch (error: any) {
        console.error('[RNDMind API] Error:', error);
        return NextResponse.json({ error: 'Falha ao gerar insights astrológicos', details: error.message }, { status: 500 });
    }
}
