export interface AnalysisIntent {
    fileUrl: string;
    fileName: string;
    agentId: string;
    fileType?: string;
    userId: string;
    timestamp: number;
}

const ANALYSIS_STORE_KEY = 'ronnyzim_pending_analysis';

/**
 * Registra a intenção de análise de um arquivo por um Agente específico (Phase 1).
 * Salva temporariamente no LocalStorage para ser consumido pelo AgentWorkspace assim que montado.
 */
export async function triggerAnalysis(fileUrl: string, fileName: string, agentId: string, userId: string, fileType?: string): Promise<void> {

    const intent: AnalysisIntent = {
        fileUrl,
        fileName,
        agentId,
        fileType,
        userId,
        timestamp: Date.now()
    };

    // Guarda localmente ANTES do delay/redirect
    localStorage.setItem(ANALYSIS_STORE_KEY, JSON.stringify(intent));

    // Dispara alerta para componentes que não desmontam (CSS Hidden mode)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ronnyzim:analysis_intent_created'));
    }

    // (Fase 1 - Simulação do processing link)
    return new Promise((resolve) => setTimeout(resolve, 1500));
}

/**
 * Lê e limpa a intenção pendente de análise
 */
export function consumePendingAnalysis(): AnalysisIntent | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(ANALYSIS_STORE_KEY);
    if (!stored) return null;

    try {
        const intent = JSON.parse(stored) as AnalysisIntent;
        // Limpar após consumo
        localStorage.removeItem(ANALYSIS_STORE_KEY);
        return intent;
    } catch (e) {
        console.error("Falha ao parsear pending analysis", e);
        return null;
    }
}
