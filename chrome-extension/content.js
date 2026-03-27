(function() {
    // Puxa todo o InnerText do site limpo do HTML
    const rawText = document.body.innerText || "";
    // Tira espaçamentos desnecessários e quebras longas demais do gupy/linkedin pra economizar bytes
    const cleanContent = rawText.replace(/\n\s*\n/g, '\n\n').trim();

    return {
        url: window.location.href,
        title: document.title,
        content: cleanContent
    };
})();
