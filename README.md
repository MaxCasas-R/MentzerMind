# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Backend (FastAPI)

El backend mínimo del proyecto se encuentra en `server/`. Es un servicio
FastAPI que expone el endpoint `POST /api/chat` y orquesta llamadas a un
modelo de lenguaje (por defecto, OpenAI). Para ejecutarlo localmente:

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 3001
```

Configura las variables de entorno en `.env` antes de iniciar el servidor.
Desde el frontend, puedes definir `VITE_API_BASE_URL=http://localhost:3001`
para consumir la API durante el desarrollo.
