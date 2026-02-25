import logging
import os
from typing import AsyncGenerator, List, Optional

from google import genai
from google.genai import types

logger = logging.getLogger("mentzermind.gemini")

async def call_gemini(message: str, context: Optional[List[dict]], system_prompt: str) -> AsyncGenerator[str, None]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada")

    # Inicializar el cliente oficial de Gemini
    client = genai.Client(api_key=api_key)

    # Construir el historial de la conversación
    contents = []
    if context:
        for msg in context:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )
    
    # Añadir el mensaje actual del usuario
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        )
    )

    # Configurar el modelo y el prompt del sistema
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=float(os.getenv("GEMINI_TEMPERATURE", "0.3")),
        max_output_tokens=int(os.getenv("GEMINI_MAX_TOKENS", "500")),
    )

    try:
        # Usar el modelo 2.5-flash que vimos que está disponible
        response_stream = await client.aio.models.generate_content_stream(
            model='gemini-2.5-flash',
            contents=contents,
            config=config
        )
        
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
                
    except Exception as e:
        logger.error("Error al llamar a Gemini SDK: %s", str(e))
        yield f"\n[Error de conexión con Gemini: {str(e)}]"
