# MentzerMind Backend (FastAPI)

Este directorio contiene un esqueleto mínimo de API para MentzerMind.
El objetivo es orquestar llamadas a un modelo de lenguaje y exponer un
único endpoint `POST /api/chat` consumido por el frontend de React.

## Requisitos

- Python 3.11 o superior.
- Clave de API del proveedor LLM (por defecto, OpenAI).

Instala las dependencias en un entorno virtual:

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copia el archivo `.env.example` a `.env` y completa los valores
necesarios. El proveedor por defecto es `openai`. Si todavía no tienes
clave, puedes establecer `LLM_PROVIDER=local` para devolver una respuesta
de prueba.

```powershell
copy .env.example .env
```

Ejecuta el servidor en modo desarrollo:

```powershell
uvicorn main:app --reload --port 3001
```

La API expone dos rutas:

- `GET /api/health` — comprobación simple de estado.
- `POST /api/chat` — recibe `{ "message": "..." }` y devuelve
  `{ "reply": "..." }` con la salida del modelo configurado.

La lógica del proveedor se encuentra en `server/main.py`. Actualmente hay
dos modos:

- `openai`: llama al endpoint `chat/completions` de OpenAI.
- `local`: devuelve un mensaje simulado para pruebas.

## Siguientes pasos sugeridos

- Añadir un adaptador para Gemini Pro reutilizando la misma interfaz.
- Implementar manejo de contexto (RAG) en la construcción del prompt.
- Crear pruebas unitarias para el servicio `dispatch_to_provider`.
- Configurar despliegue (por ejemplo, Render o Railway) y variables de entorno seguras.
