"""
Servico de Vetorizacao de Memoria do RonnyZim OS.
Gera embeddings vetoriais a partir de fatos de usuarios para indexacao no pgvector do Supabase.

Como rodar:
    uv run uvicorn memory_vectorizer.main:app --port 8001 --reload
"""

import random
from fastapi import FastAPI, HTTPException
from memory_vectorizer.schemas import UserFactInput, VectorizedFactOutput

app = FastAPI(
    title="RonnyZim Memory Vectorizer",
    description="Servico corporativo focado em geracao de embeddings para pgvector do Supabase.",
    version="1.0.0"
)

@app.post(
    "/vectorize",
    response_model=VectorizedFactOutput,
    summary="Gera o embedding vetorial de um fato de usuario",
    description="Recebe o payload estruturado de um fato, simula a geracao de um vetor de 1536 dimensoes e o prepara para insercao no pgvector."
)
async def vectorize_fact(fact_in: UserFactInput) -> VectorizedFactOutput:
    try:
        # Texto unificado para gerar o embedding
        combined_text = f"User: {fact_in.user_id} | Category: {fact_in.category} | Key: {fact_in.property_key} | Value: {fact_in.value}"
        
        # Simulando geracao de embedding de 1536 dimensoes (padrao text-embedding-3-small / Ada-002)
        # Em producao, aqui se chamaria a API da OpenAI/Gemini ou um modelo local como SentenceTransformers
        random.seed(hash(combined_text))
        mock_embedding = [random.uniform(-1.0, 1.0) for _ in range(1536)]
        
        return VectorizedFactOutput(
            user_id=fact_in.user_id,
            category=fact_in.category,
            property_key=fact_in.property_key,
            value=fact_in.value,
            embedding=mock_embedding
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Falha interna ao gerar embedding vetorial: {str(e)}"
        )

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy", "service": "memory_vectorizer"}
