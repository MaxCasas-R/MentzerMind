import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

async def test_models():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("No hay API KEY")
        return
        
    url = f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}'
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = [m['name'] for m in data.get('models', [])]
            print("Modelos disponibles:")
            for m in models:
                print(f" - {m}")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_models())
