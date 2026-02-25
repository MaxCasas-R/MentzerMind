import asyncio
import os
from google import genai

async def main():
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    response = await client.aio.models.generate_content_stream(
        model='gemini-2.5-flash',
        contents='Hola, dime 10 palabras'
    )
    async for chunk in response:
        print(repr(chunk.text))

if __name__ == "__main__":
    asyncio.run(main())
