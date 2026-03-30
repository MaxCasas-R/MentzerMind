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

#
# async def call_local_stub(message: str, context: Optional[List[dict]], system_prompt: str) -> AsyncGenerator[str, None]:
#     logger.debug("Simulando fragmentación de paquetes TCP (SSE)...")
#     
#     # Paquete 1: Un JSON incompleto (le falta cerrar las comillas y la llave)
#     fragmento_1 = '{"text": "Este mensaje llegó fragmentado en '
#     
#     # Paquete 2: El resto del JSON
#     fragmento_2 = 'dos paquetes TCP diferentes."}'
#     
#     # Disparamos la primera mitad
#     yield fragmento_1
#     
#     # Simulamos que el paquete se atoró en la red por 2 segundos
#     await asyncio.sleep(2.0)
#     
#     # Disparamos la segunda mitad
#     yield fragmento_2
#
