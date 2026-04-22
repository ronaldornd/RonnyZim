import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/ai-factory';
import { GoogleGenAI, Type } from '@google/genai';

// Injetado via Factory no request

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
        },
        technical_affinity: {
            type: Type.OBJECT,
            properties: {
                frontend: { type: Type.NUMBER, description: "XP multiplier for frontend tasks (0.8 to 1.2)" },
                backend: { type: Type.NUMBER, description: "XP multiplier for backend tasks (0.8 to 1.2)" },
                database: { type: Type.NUMBER, description: "XP multiplier for database tasks (0.8 to 1.2)" },
                devops: { type: Type.NUMBER, description: "XP multiplier for devops tasks (0.8 to 1.2)" },
                design: { type: Type.NUMBER, description: "XP multiplier for design tasks (0.8 to 1.2)" }
            },
            required: ['frontend', 'backend', 'database', 'devops', 'design']
        },
        daily_energy_score: { 
            type: Type.INTEGER, 
            description: "A total energy score from 0 to 100 based on the planetary transits for the user today." 
        }
    },
    required: ['cards', 'technical_affinity', 'daily_energy_score']
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawBirthDate = searchParams.get('birthDate'); // YYYY-MM-DD
        const rawBirthTime = searchParams.get('birthTime'); // HH:mm
        const rawBirthCity = searchParams.get('birthCity'); // e.g. "São Paulo, SP, Brasil"

        let apiKey = process.env.GEMINI_API_KEY!;
        let modelId = 'gemini-2.0-flash';

        try {
            const supabase = await createRouteHandlerClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const aiConfig = await getAIProvider(user.id);
                apiKey = aiConfig.apiKey;
                modelId = aiConfig.modelId;
            }
        } catch (e) {
            console.error('Failed to resolve AI Config from factory', e);
        }

        const ai = new GoogleGenAI({ apiKey });

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

        const systemPrompt = `Você é o RonnyZim, um Tech Lead Sarcástico e Místico que cruza arquétipos astrológicos com a realidade brutal do mercado de TI para produzir orientações diárias curtas e ácidas.

Dados natais do usuário: ${zodiacNote}
Data de hoje: ${todayFormatted} (ISO: ${today})

Sua missão: Cruzar o mapa natal do usuário com os trânsitos planetários de hoje para gerar um "Mural de Operação" tático. 

Tom de voz:
- Sarcástico, pragmático, levemente ácido (humor de quem já viu muita produção cair na sexta-feira).
- Use gírias de dev (deploy, refatorar, bug, tipagem, terminal, squad, stack).
- Evite platitudes "gratiluz". O mercado não liga pros planetas, ele quer a feature rodando.

Estrutura dos cards:
1. **Trunfo do Dia**: Onde o biorritmo técnico está no pico. O que o usuário deve atacar com força (ex: refatorar, codar lógica complexa, negociar com a squad).
2. **Desafio do Dia**: Onde a energia está drenada ou onde há risco de vacilos (ex: não mexer em CSS, evitar reuniões inúteis, cuidado com deploy sem teste).
3. **Clima da Matriz**: Uma análise de 2-3 frases cruzando a posição dos astros com o estado mental/técnico do dia.

Assign a "technical_affinity" multiplier (0.8 to 1.2) for each category based on the day's resonance:
- **frontend**: Mercúrio/Urano (agilidade visual, interação).
- **backend/database**: Saturno/Plutão (estrutura, lógica oculta, persistência).
- **devops**: Marte/Sol (automação, infra, fluxo).
- **design**: Vênus/Netuno (estética, harmonia, empatia).

Gere exatamente 5 cards de insight no formato JSON, em português brasileiro, sendo extremamente direto e "pé no chão".`;

        const response = await ai.models.generateContent({
            model: modelId,
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
