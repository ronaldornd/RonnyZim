from uuid import UUID
from typing import List
from pydantic import BaseModel, Field

class UserFactInput(BaseModel):
    """
    Representa a entrada de dados de um fato de usuario para ser vetorizado.
    """
    user_id: UUID = Field(description="UUID do usuario correspondente no auth.users")
    category: str = Field(description="Categoria contextual do fato (ex: system, skills)")
    property_key: str = Field(description="Chave do fato (ex: xp_total, active_quests)")
    value: str = Field(description="Conteudo textual ou JSON stringificado do fato")

class VectorizedFactOutput(BaseModel):
    """
    Representa o fato de usuario processado e vetorizado pronto para salvar no banco pgvector.
    """
    user_id: UUID = Field(description="UUID do usuario correspondente no auth.users")
    category: str = Field(description="Categoria contextual do fato")
    property_key: str = Field(description="Chave do fato")
    value: str = Field(description="Conteudo do fato")
    embedding: List[float] = Field(description="Vetor de embeddings de 1536 dimensoes")
