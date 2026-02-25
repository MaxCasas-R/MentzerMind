import logging
import os
from typing import AsyncGenerator, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.gemini_service import call_gemini
from services.local_service import call_local_stub
from services.openai_service import call_openai

load_dotenv()

logger = logging.getLogger("mentzermind.api")
logging.basicConfig(level=logging.INFO)

DEFAULT_SYSTEM_PROMPT = (
    "Eres MentzerMind, un asistente especializado en fitness y nutrición. "
    "Responde con precisión basada en evidencia, mantén un tono cercano y "
    "limita tus respuestas a la información proporcionada por el usuario. "
    "Si no tienes información suficiente, pide datos adicionales."
)

SUPPORTED_PROVIDERS = {"openai", "local", "gemini"}


class MessageDict(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    """Payload esperado desde el frontend."""

    message: str
    conversationId: Optional[str] = None
    context: Optional[List[MessageDict]] = None


class ChatResponse(BaseModel):
    """Respuesta mínima entregada al frontend."""

    reply: str


app = FastAPI(title="MentzerMind API", version="0.1.0")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar por el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_llm_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower().strip()
    if provider not in SUPPORTED_PROVIDERS:
        logger.warning("Proveedor LLM '%s' no soportado. Revirtiendo a 'openai'.", provider)
        return "openai"
    return provider


def get_system_prompt() -> str:
    prompt = os.getenv("SYSTEM_PROMPT")
    return prompt if prompt else DEFAULT_SYSTEM_PROMPT


async def dispatch_to_provider(message: str, context: Optional[List[MessageDict]]) -> AsyncGenerator[str, None]:
    provider = get_llm_provider()
    system_prompt = get_system_prompt()
    
    # Convertir MessageDict a dict para los servicios
    context_dicts = [msg.model_dump() for msg in context] if context else None

    if provider == "openai":
        async for chunk in call_openai(message, context_dicts, system_prompt):
            yield chunk
    elif provider == "gemini":
        async for chunk in call_gemini(message, context_dicts, system_prompt):
            yield chunk
    elif provider == "local":
        async for chunk in call_local_stub(message, context_dicts, system_prompt):
            yield chunk
    else:
        yield f"Error: Proveedor LLM '{provider}' no soportado"


@app.post("/api/chat")
async def create_chat_completion(payload: ChatRequest):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="El campo 'message' es obligatorio")

    async def stream_generator():
        import json
        try:
            async for chunk in dispatch_to_provider(payload.message, payload.context):
                # Enviar el chunk en formato SSE (Server-Sent Events)
                data = json.dumps({"text": chunk})
                yield f"data: {data}\n\n"
            # Señal explícita de fin de stream
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.exception("Error generando respuesta LLM")
            error_data = json.dumps({"error": str(exc)})
            yield f"data: {error_data}\n\n"

    # Volvemos a text/event-stream que es el estándar para esto
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(stream_generator(), media_type="text/event-stream", headers=headers)


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
