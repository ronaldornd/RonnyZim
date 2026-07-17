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
    Representa a vaga de emprego estruturada de forma limpa apos o scraping e analise.
    Atende aos principios de llm-structured-output.
    """
    title: str = Field(description="Titulo da vaga de emprego (ex: Senior React Dev)")
    company: str = Field(description="Nome da empresa contratante")
    location: Optional[str] = Field(None, description="Localizacao da vaga (ex: Remoto, Sao Paulo - Hibrido, etc.)")
    description_summary: str = Field(description="Resumo da descricao da vaga com no maximo 3 paragrafos limpos.")
    skills_required: List[str] = Field(default_factory=list, description="Lista de tecnologias e habilidades obrigatorias para a vaga")
    nice_to_have_skills: List[str] = Field(default_factory=list, description="Lista de habilidades ou tecnologias diferenciais (nice-to-have)")
    seniority_level: str = Field(description="Nivel de senioridade da vaga (valores validos: Junior, Pleno, Senior, ou N/A)")
    salary_range: Optional[str] = Field(None, description="Faixa salarial informada (se houver)")
    url: Optional[str] = Field(None, description="URL de origem da vaga")
