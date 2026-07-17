"""
Servico de Radar Scraper do RonnyZim OS.
Efetua scraping ou busca de vagas de emprego e as estrutura em formatos tipados.

Como rodar:
    uv run uvicorn radar_scraper.main:app --port 8002 --reload
"""

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from radar_scraper.schemas import JobScrapeInput, JobScrapeResult

app = FastAPI(
    title="RonnyZim Radar Scraper",
    description="Servico de scraping e estruturacao de vagas utilizando httpx, BeautifulSoup e Pydantic.",
    version="1.0.0"
)

@app.post(
    "/scrape",
    response_model=JobScrapeResult,
    summary="Raspa e estrutura uma vaga de emprego",
    description="Consome a URL enviada via httpx/BeautifulSoup (ou executa busca simulada) e retorna dados de vagas tipados de forma estrita."
)
async def scrape_job(payload: JobScrapeInput) -> JobScrapeResult:
    # Caso 1: Foi fornecida uma URL de vaga
    if payload.url:
        try:
            url_str = str(payload.url)
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url_str, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Nao foi possivel acessar a URL (Status: {response.status_code})")
                
            # Exemplo de uso de BeautifulSoup para extrair texto basico
            soup = BeautifulSoup(response.text, "html.parser")
            page_title = soup.title.string if soup.title else "Vaga Encontrada"
            
            # Simulando processamento da LLM (llm-structured-output) sobre o HTML extraido
            # Aqui em producao integrariamos com o LLM (Gemini/GPT) estruturado usando responseSchema
            return JobScrapeResult(
                title=page_title.strip()[:100],
                company="Empresa Identificada",
                location="Remoto / Hibrido",
                description=f"Conteudo parseado da pagina: {soup.get_text()[:300].strip()}...",
                skills_required=["React", "TypeScript", "Next.js"],
                salary_range="A combinar",
                url=url_str
            )
            
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Erro de requisicao HTTP: {str(exc)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Falha de processamento de scraping: {str(e)}")

    # Caso 2: Foi fornecido apenas termo de busca (query)
    elif payload.query:
        # Simula raspagem via busca de mercado
        return JobScrapeResult(
            title=f"Vaga de {payload.query}",
            company="Global Tech Corp",
            location="Remoto",
            description=f"Descricao simulada baseada na query de busca: {payload.query}",
            skills_required=[payload.query.split()[-1] if payload.query.split() else "Python", "Docker", "Git"],
            salary_range="R$ 10.000 - R$ 15.000",
            url="https://exemplo.com/vagas/1"
        )
    
    else:
        raise HTTPException(status_code=422, detail="E necessario fornecer pelo menos 'url' ou 'query'.")

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy", "service": "radar_scraper"}
