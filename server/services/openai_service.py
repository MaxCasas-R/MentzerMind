import json
import logging
import os
from typing import AsyncGenerator, List, Optional

import httpx

logger = logging.getLogger("mentzermind.openai")

async def call_openai(message: str, context: Optional[List[dict]], system_prompt: str) -> AsyncGenerator[str, None]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY no está configurada")

    messages = [{"role": "system", "content": system_prompt}]
    if context:
        for msg in context:
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        "messages": messages,
        "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.3")),
        "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "500")),
        "stream": True,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    timeout = float(os.getenv("OPENAI_TIMEOUT", "30"))

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers,
        ) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error("Error al llamar a OpenAI: %s", error_text)
                yield f"Error: OpenAI respondió con {response.status_code}"
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
                    except json.JSONDecodeError:
                        logger.warning("Error decodificando JSON de OpenAI: %s", data_str)
