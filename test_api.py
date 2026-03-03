import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv('server/.env')

async def main():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("NO API KEY")
        return

    client = genai.Client(api_key=api_key)
    try:
        response = await client.aio.models.generate_content_stream(
            model='gemini-2.5-flash',
            contents='Hola'
        )
        async for chunk in response:
            print("RESPUESTA OK:", chunk.text)
    except Exception as e:
        print("ERROR_RECIBIDO:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
