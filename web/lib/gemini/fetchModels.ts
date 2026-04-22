import { GoogleGenAI } from '@google/genai';

export async function getAvailableAudioModels(apiKey: string) {
  // Inicializa o cliente do SDK
  const ai = new GoogleGenAI({ apiKey }); 
  
  const validAudioModels = [];
  
  try {
    // O método list() do SDK retorna um AsyncGenerator no SDK v2 ou uma lista
    // Dependendo da versão exata, mas o loop for await é seguro
    const response = await ai.models.list();
    
    for await (const model of response as any) {
      const name = model.name.toLowerCase();
      const displayName = model.displayName || name.replace('models/', '');
      const description = (model.description || '').toLowerCase();
      
      // 1. Blacklist (Ignora modelos de texto legado, embeddings e visão pura)
      if (name.includes('embedding') || name.includes('imagen') || name.includes('aqa') || name.includes('vision') || name.includes('nano-banana')) {
        continue;
      }
      
      // 2. Whitelist (Verifica capacidade de Live/Streaming ou Famílias Multimodais)
      const methods = model.supportedGenerationMethods || [];
      const isLiveCapable = methods.includes('bidiGenerateContent');
      
      // Famílias multimodais que suportam áudio nativo (1.5, 2.0, 2.5, 3.0)
      const isStandardMultimodal = name.includes('gemini-1.5') || 
                                   name.includes('gemini-2.0') || 
                                   name.includes('gemini-2.5') || 
                                   name.includes('gemini-3.0') ||
                                   name.includes('gemini-3.1');
      
      const hasAudioKeywords = name.includes('audio') || description.includes('audio') ||
                               name.includes('live') || description.includes('live');

      if (isLiveCapable || isStandardMultimodal || hasAudioKeywords) {
        validAudioModels.push({
          id: model.name.replace('models/', ''), // Remove o prefixo para usar no payload
          displayName: displayName,
          description: model.description,
          version: model.version || 'latest',
          supportedGenerationMethods: methods
        });
      }
    }
    
    return validAudioModels;
  } catch (error) {
    console.error("Erro ao listar modelos via @google/genai SDK:", error);
    throw error;
  }
}
