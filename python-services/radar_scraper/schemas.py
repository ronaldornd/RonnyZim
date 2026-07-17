from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl

class JobScrapeInput(BaseModel):
    """
    Representa a entrada para a raspagem ou busca de vaga.
    """
    url: Optional[HttpUrl] = Field(None, description="URL direta da vaga de emprego para raspar")
    query: Optional[str] = Field(None, description="Termo de busca alternativo para varrer na web")

class JobScrapeResult(BaseModel):
    """
    Representa a vaga de emprego estruturada de forma limpa apos o processamento/scraping.
    Atende aos principios de llm-structured-output.
    """
    title: str = Field(description="Titulo da vaga de emprego (ex: Senior React Dev)")
    company: str = Field(description="Nome da empresa contratante")
    location: Optional[str] = Field(None, description="Localizacao ou informacao de home office (ex: Remoto, Sao Paulo)")
    description: str = Field(description="Descricao detalhada ou resumo do escopo da vaga")
    skills_required: List[str] = Field(default_factory=list, description="Lista de habilidades/tecnologias exigidas (ex: React, Node, Python)")
    salary_range: Optional[str] = Field(None, description="Faixa salarial ou compensacao anual informada")
    url: Optional[str] = Field(None, description="URL de origem da vaga")
