document.getElementById('extractBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    const btn = document.getElementById('extractBtn');
    
    statusEl.textContent = "Injetando rastreador na aba ativa...";
    statusEl.className = "";
    btn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
            throw new Error("Não foi possível acessar a aba ativa.");
        }

        // Executa o content.js na aba ativa para ler o DOM
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const data = injectionResults[0]?.result;
        if (!data || !data.content) {
            throw new Error("Nenhum texto pôde ser extraído da página.");
        }

        statusEl.textContent = "Localizando sessão neural do RonnyZim OS...";

        // Busca o user_id do Supabase executando script na aba do RonnyZim OS
        let userId = null;
        try {
            const osTabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
            if (osTabs.length > 0) {
                const osTab = osTabs[0];
                const sessionResults = await chrome.scripting.executeScript({
                    target: { tabId: osTab.id },
                    func: () => {
                        // Busca o user_id do Supabase auth no localStorage
                        for (const key of Object.keys(localStorage)) {
                            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                                try {
                                    const raw = localStorage.getItem(key);
                                    const parsed = JSON.parse(raw);
                                    return parsed?.user?.id || null;
                                } catch { return null; }
                            }
                        }
                        return null;
                    }
                });
                userId = sessionResults[0]?.result;
            }
        } catch (e) {
            console.warn("Falha ao buscar user_id do RonnyZim OS:", e);
        }

        if (!userId) {
            throw new Error("Sessão não encontrada. Abra o RonnyZim OS (localhost:3000) e faça login primeiro.");
        }

        statusEl.textContent = `Sessão encontrada. Enviando (${data.content.length} bytes)...`;

        // Dispara ponte com o localhost Next.js
        const res = await fetch('http://localhost:3000/api/clipper', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify({
                url: data.url,
                title: data.title,
                content: data.content
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Erro HTTP ${res.status}`);
        }

        const resData = await res.json();
        
        statusEl.textContent = "Sucesso Absoluto! Vaga capturada.\nID: " + resData.insight_id;
        statusEl.className = "success";
        btn.textContent = "Vaga Extraída ✓";

    } catch (err) {
        statusEl.textContent = "Erro: " + err.message;
        statusEl.className = "error";
        btn.disabled = false;
        console.error(err);
    }
});
