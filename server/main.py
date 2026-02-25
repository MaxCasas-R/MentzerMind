import logging
import os
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

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


class ChatRequest(BaseModel):
    """Payload esperado desde el frontend."""

    message: str
    conversationId: Optional[str] = None
    context: Optional[List[str]] = None


class ChatResponse(BaseModel):
    """Respuesta mínima entregada al frontend."""

    reply: str


app = FastAPI(title="MentzerMind API", version="0.1.0")


def get_llm_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower().strip()
    if provider not in SUPPORTED_PROVIDERS:
        logger.warning("Proveedor LLM '%s' no soportado. Revirtiendo a 'openai'.", provider)
        return "openai"
    return provider


def get_system_prompt() -> str:
    prompt = os.getenv("SYSTEM_PROMPT")
    return prompt if prompt else DEFAULT_SYSTEM_PROMPT


def build_user_prompt(message: str, context: Optional[List[str]]) -> str:
    if not context:
        return message

    context_block = "\n\n".join(context)
    return (
        "Información de referencia:\n"
        f"{context_block}\n\n"
        "Pregunta del usuario:\n"
        f"{message}"
    )


async def call_openai(prompt: str, system_prompt: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY no está configurada")

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.3")),
        "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "500")),
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    timeout = float(os.getenv("OPENAI_TIMEOUT", "30"))

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    if response.status_code != 200:
        error_text = response.text
        logger.error("Error al llamar a OpenAI: %s", error_text)
        raise RuntimeError(f"OpenAI respondió con {response.status_code}: {error_text}")

    body = response.json()
    reply = body.get("choices", [{}])[0].get("message", {}).get("content")

    if not reply:
        logger.error("OpenAI no devolvió contenido válido: %s", body)
        raise RuntimeError("OpenAI no devolvió una respuesta válida")

    return reply.strip()


async def call_gemini(prompt: str, system_prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada")

    full_prompt = f"Instrucciones del sistema: {system_prompt}\n\n{prompt}"
    
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": float(os.getenv("GEMINI_TEMPERATURE", "0.3")),
            "maxOutputTokens": int(os.getenv("GEMINI_MAX_TOKENS", "500")),
        }
    }

    headers = {"Content-Type": "application/json"}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    timeout = float(os.getenv("GEMINI_TIMEOUT", "30"))

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        error_text = response.text
        logger.error("Error al llamar a Gemini: %s", error_text)
        raise RuntimeError(f"Gemini respondió con {response.status_code}: {error_text}")

    body = response.json()
    try:
        reply = body["candidates"][0]["content"]["parts"][0]["text"]
        return reply.strip()
    except (KeyError, IndexError) as e:
        logger.error("Estructura de respuesta de Gemini inesperada: %s", body)
        raise RuntimeError("Gemini no devolvió una respuesta válida") from e


async def call_local_stub(prompt: str, system_prompt: str) -> str:
    logger.debug("Usando proveedor local stub.")
    return (
        "[Modo local] Aún no hay un modelo configurado. "
        "Mensaje recibido: "
        f"{prompt}"
    )


async def dispatch_to_provider(message: str, context: Optional[List[str]]) -> str:
    provider = get_llm_provider()
    system_prompt = get_system_prompt()
    prompt = build_user_prompt(message, context)

    if provider == "openai":
        return await call_openai(prompt, system_prompt)

    if provider == "gemini":
        return await call_gemini(prompt, system_prompt)

    if provider == "local":
        return await call_local_stub(prompt, system_prompt)

    raise RuntimeError(f"Proveedor LLM '{provider}' no soportado")


@app.post("/api/chat", response_model=ChatResponse)
async def create_chat_completion(payload: ChatRequest) -> ChatResponse:
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="El campo 'message' es obligatorio")

    try:
        reply = await dispatch_to_provider(payload.message, payload.context)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Error generando respuesta LLM")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(reply=reply)


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
