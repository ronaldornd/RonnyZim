import asyncio
import time
import logging
from typing import Any, Dict
from uuid import UUID
from pydantic import BaseModel, Field, ValidationError

# Configuração simples de logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("MemoryGuardianEval")

class UserFactResponse(BaseModel):
    """
    Modelo Pydantic que valida a estrutura de resposta para inserção na tabela public.user_facts.
    Reflete fielmente o schema ativo no banco de dados do Supabase.
    """
    user_id: UUID = Field(description="UUID correspondente ao auth.users.id do usuário")
    category: str = Field(description="Categoria ou contexto do fato")
    property_key: str = Field(description="Chave única que identifica o fato")
    value: str = Field(description="Valor do fato, armazenado como string/texto no banco de dados")

async def run_evaluation(payload: Dict[str, Any], label: str) -> None:
    """
    Simulador de avaliação que calcula latência, executa a validação estrutural 
    da resposta da LLM/MCP e exibe resultados estruturados.
    """
    logger.info(f"--- Iniciando Avaliação: {label} ---")
    start_time = time.perf_counter()
    
    # Simula latência de chamada de modelo
    await asyncio.sleep(0.12)
    
    latency = (time.perf_counter() - start_time) * 1000  # em ms
    
    try:
        validated_fact = UserFactResponse.model_validate(payload)
        logger.info(f"STATUS: SUCESSO")
        logger.info(f"Latência: {latency:.2f} ms")
        logger.info(f"Dados Validados: {validated_fact.model_dump()}")
    except ValidationError as e:
        logger.error(f"STATUS: FALHA DE VALIDAÇÃO")
        logger.error(f"Latência: {latency:.2f} ms")
        logger.error(f"Erros de validação:\n{e}")
    logger.info(f"---------------------------------------\n")

async def main() -> None:
    # 1. Payload Válido
    valid_payload = {
        "user_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "category": "system",
        "property_key": "xp_total",
        "value": "1500"
    }

    # 2. Payload Válido com valor stringificado de JSON complexo (ex: biorhythm)
    complex_payload = {
        "user_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "category": "system",
        "property_key": "biorhythm_data",
        "value": '{"physical": 0.85, "emotional": -0.12, "intellectual": 0.45}'
    }

    # 3. Payload Inválido (UUID quebrado e campo value ausente)
    invalid_payload = {
        "user_id": "invalid-uuid-1234",
        "category": "system",
        "property_key": "skills"
    }

    await run_evaluation(valid_payload, "Payload Válido (XP Total)")
    await run_evaluation(complex_payload, "Payload Válido (Biorritmo Complexo)")
    await run_evaluation(invalid_payload, "Payload Inválido (Esperando falha de UUID e campos ausentes)")

if __name__ == "__main__":
    asyncio.run(main())
