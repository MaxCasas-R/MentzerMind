import json
import logging
import os
from typing import AsyncGenerator, List, Optional

import httpx

logger = logging.getLogger("mentzermind.gemini")

async def call_gemini(message: str, context: Optional[List[dict]], system_prompt: str) -> AsyncGenerator[str, None]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada")

    contents = []
    if context:
        for msg in context:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})
    
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": float(os.getenv("GEMINI_TEMPERATURE", "0.3")),
            "maxOutputTokens": int(os.getenv("GEMINI_MAX_TOKENS", "500")),
        }
    }

    headers = {"Content-Type": "application/json"}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key={api_key}"
    timeout = float(os.getenv("GEMINI_TIMEOUT", "30"))

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error("Error al llamar a Gemini: %s", error_text)
                yield f"Error: Gemini respondió con {response.status_code}"
                return

            async for chunk in response.aiter_bytes():
                if chunk:
                    try:
                        chunk_str = chunk.decode('utf-8')
                        chunk_str = chunk_str.strip().lstrip('[').rstrip(']').strip()
                        if chunk_str.startswith(','):
                            chunk_str = chunk_str[1:].strip()
                        
                        if chunk_str:
                            data = json.loads(chunk_str)
                            if "candidates" in data and len(data["candidates"]) > 0:
                                parts = data["candidates"][0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    yield parts[0]["text"]
                    except json.JSONDecodeError:
                        pass
