import asyncio
import logging
from typing import AsyncGenerator, List, Optional

logger = logging.getLogger("mentzermind.local")

async def call_local_stub(message: str, context: Optional[List[dict]], system_prompt: str) -> AsyncGenerator[str, None]:
    logger.debug("Usando proveedor local stub.")
    response_text = (
        "[Modo local] Aún no hay un modelo configurado. "
        "Mensaje recibido: "
        f"{message}"
    )
    # Simular streaming
    words = response_text.split()
    for word in words:
        yield word + " "
        await asyncio.sleep(0.1)
