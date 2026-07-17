import os
import urllib.parse
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
import httpx
from pydantic_ai import Agent
from radar_scraper.schemas import JobScrapeInput, JobScrapeResult

app = FastAPI(
    title="RonnyZim Radar Scraper",
    description="Servico de scraping e estruturacao de vagas utilizando httpx, BeautifulSoup e Pydantic-AI.",
    version="1.0.0"
)

# Resolve a API Key e o modelo de forma explicita
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

if api_key:
    from pydantic_ai.models.google import GoogleModel
    from pydantic_ai.providers.google import GoogleProvider
    
    # Cria o provedor com a chave injetada explicitamente
    provider = GoogleProvider(api_key=api_key)
    model = GoogleModel(gemini_model_name, provider=provider)
else:
    # Fallback para o modelo de teste a fim de evitar crash no boot do Uvicorn se a chave estiver vazia
    model = "test"

agent = Agent(
    model,
    output_type=JobScrapeResult,
    system_prompt=(
        "Você é o Hunter-Zim, um extrator cognitivo e interpretador de vagas do RonnyZim OS.\n"
        "Seu objetivo é ler a descrição bruta da vaga (que pode conter ruído de HTML limpo) "
        "e extrair de forma precisa todos os metadados requeridos.\n"
        "Siga estas diretrizes com precisão cirúrgica:\n"
        "- title: Título corporativo oficial da vaga.\n"
        "- company: Nome da empresa contratante.\n"
        "- location: Formato claro (ex: 'Remoto', 'São Paulo - Híbrido').\n"
        "- description_summary: Resumo em no máximo 3 parágrafos limpos cobrando o desafio principal da vaga.\n"
        "- skills_required: Habilidades e tecnologias obrigatórias exigidas na vaga.\n"
        "- nice_to_have_skills: Tecnologias consideradas diferenciais ou desejáveis.\n"
        "- seniority_level: Nível de senioridade estrito ('Junior', 'Pleno', 'Senior', ou 'N/A').\n"
        "- salary_range: Faixa de remuneração se explicitada, caso contrário None."
    )
)

@app.post(
    "/scrape",
    response_model=JobScrapeResult,
    summary="Raspa e estrutura uma vaga de emprego real com IA",
    description="Consome a URL com httpx/BeautifulSoup, executa limpeza agressiva de tags e envia ao Gemini via PydanticAI para extração estruturada."
)
async def scrape_job(payload: JobScrapeInput) -> JobScrapeResult:
    # Garantir que a API Key existe
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="Configuração ausente: GOOGLE_API_KEY ou GEMINI_API_KEY não foi encontrada no ambiente."
        )

    # Caso 1: Foi fornecida uma URL de vaga
    if payload.url:
        url_str = str(payload.url)
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url_str, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
                })
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Erro de status HTTP ao acessar a URL da vaga: {exc.response.status_code} - {exc.response.reason_phrase}"
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Falha de rede ao tentar alcançar o servidor da vaga: {str(exc)}"
            )

        try:
            # Limpeza agressiva do HTML
            soup = BeautifulSoup(response.text, "html.parser")
            
            for element in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
                element.decompose()
                
            text_content = soup.get_text(separator=' ', strip=True)
            # Limitar para evitar estourar limites de contexto
            text_content = text_content[:15000]
            
            if not text_content.strip():
                raise ValueError("O conteúdo extraído da página está completamente vazio.")
                
            # Executar análise cognitiva com PydanticAI
            result = await agent.run(
                f"Analise o texto bruto extraído da URL ({url_str}):\n\n{text_content}"
            )
            
            job_result = result.output
            job_result.url = url_str
            return job_result
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Falha cognitiva no processamento da vaga: {str(e)}"
            )

    # Caso 2: Foi fornecido apenas termo de busca (query)
    elif payload.query:
        try:
            # Usa o Gemini para gerar dados de vaga simulada de mercado realista
            result = await agent.run(
                f"Gere uma descrição de vaga e metadados de mercado fictícios extremamente realistas baseados na busca: '{payload.query}'. O ano de referência é 2026."
            )
            
            job_result = result.output
            escaped_query = urllib.parse.quote(payload.query)
            job_result.url = f"https://www.linkedin.com/jobs/search/?keywords={escaped_query}"
            return job_result
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao simular vaga baseada na busca cognitiva: {str(e)}"
            )
            
    else:
        raise HTTPException(status_code=422, detail="É necessário fornecer pelo menos 'url' ou 'query'.")

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy", "service": "radar_scraper"}
