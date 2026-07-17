"""
Servidor FastMCP do RonnyZim OS.
Expoe ferramentas de IA e recursos de contexto no Model Context Protocol.

Como rodar:
    # Em desenvolvimento com MCP Inspector
    uv run mcp dev mcp_server/main.py
"""

from typing import List, Dict, Any
from mcp.server.fastmcp import FastMCP

# Inicializa o servidor FastMCP do RonnyZim OS
mcp = FastMCP("ronnyzim-mcp")

@mcp.tool(
    name="analyze_affinity",
    description="Analisa a afinidade entre o perfil técnico de um candidato e os requisitos de uma vaga."
)
def analyze_affinity(
    profile_skills: List[str], 
    job_requirements: List[str]
) -> Dict[str, Any]:
    """
    Analisa quais skills do perfil combinam com a vaga, quais sao os gaps 
    e calcula uma taxa percentual de compatibilidade.
    """
    profile_set = {s.strip().lower() for s in profile_skills}
    job_set = {r.strip().lower() for r in job_requirements}
    
    if not job_set:
        return {
            "match_percentage": 0,
            "strong_matches": [],
            "missing_skills": [],
            "feedback": "A vaga nao informou requisitos tecnicos validos."
        }
        
    strong_matches = list(profile_set.intersection(job_set))
    missing_skills = list(job_set.difference(profile_set))
    
    match_percentage = int((len(strong_matches) / len(job_set)) * 100)
    
    # Formata a capitalizacao original para retorno
    orig_strong = [s for s in profile_skills if s.strip().lower() in strong_matches]
    orig_missing = [r for r in job_requirements if r.strip().lower() in missing_skills]
    
    return {
        "match_percentage": match_percentage,
        "strong_matches": orig_strong,
        "missing_skills": orig_missing,
        "feedback": (
            f"Excelente compatibilidade de {match_percentage}%! Voce atende aos principais requisitos."
            if match_percentage >= 70 else
            f"Compatibilidade de {match_percentage}%. Identificamos gaps importantes em: {', '.join(orig_missing)}."
        )
    }

@mcp.resource("prompts://system-brief")
def get_system_brief() -> str:
    """
    Retorna a diretriz de comportamento basica e identidade do RonnyZim OS.
    """
    return (
        "RONNYZIM OS SYSTEM BRIEF:\n"
        "O RonnyZim OS e um ecossistema focado em IA, assessoria de carreira e produtividade corporativa.\n"
        "A identidade estetica e Mystic-Cyber e o comportamento dos agentes deve ser pragmatica, "
        "com foco em performance tecnica e seguranca absoluta (incluindo RLS e validacao estrita)."
    )

@mcp.prompt("dossier-builder")
def dossier_builder_prompt(candidate_bio: str, job_description: str) -> str:
    """
    Cria um prompt estruturado para gerar dossies de alvos (targets).
    """
    return (
        f"Analise a biografia do candidato:\n{candidate_bio}\n\n"
        f"E cruze com a descricao da vaga abaixo:\n{job_description}\n\n"
        "Identifique 3 pontos fortes, 3 gaps de competências tecnicos e sugira "
        "uma estrategia de infiltracao/abordagem em formato markdown."
    )
