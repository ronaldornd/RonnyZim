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

        statusEl.textContent = `Enviando requisição CORS (Tamanho: ${data.content.length} bytes)...`;

        // Dispara ponte com o localhost Next.js
        const res = await fetch('http://localhost:3000/api/clipper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
