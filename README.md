# MentzerMind 🧠💪

**MentzerMind** es una aplicación web full-stack impulsada por Inteligencia Artificial que actúa como un entrenador personal experto en la filosofía **"Heavy Duty"** (Alta Intensidad) creada por Mike Mentzer. 

Este proyecto fue diseñado con una arquitectura moderna, modular y escalable, permitiendo interacciones en tiempo real mediante streaming de texto y una interfaz de usuario fluida.

---

## 🚀 Características Principales

- **Streaming en Tiempo Real (SSE):** Las respuestas de la IA se generan y muestran en la pantalla palabra por palabra, ofreciendo una experiencia de usuario dinámica y sin tiempos de espera prolongados.
- **Arquitectura Modular de LLMs:** El backend está diseñado con un patrón de fábrica (Factory Pattern) que permite intercambiar el "motor" de IA (Gemini, OpenAI, o modelos locales) simplemente cambiando una variable de entorno, sin reescribir la lógica del sistema.
- **Memoria de Contexto:** El chatbot recuerda los últimos mensajes de la conversación, permitiendo un diálogo natural y coherente.
- **Renderizado Markdown:** Soporte completo para formato Markdown en el chat (negritas, listas, tablas) para respuestas estructuradas y fáciles de leer.
- **Personalidad Estricta (System Prompting):** La IA está rigurosamente configurada para responder basándose en principios científicos de hipertrofia, priorizando la intensidad sobre el volumen y evitando la "bro-science".

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React.js** (con Vite para un empaquetado ultrarrápido)
- **CSS3** (Diseño responsivo y animaciones personalizadas)
- **React Markdown & Remark GFM** (Para renderizado de texto enriquecido)
- **Lucide React** (Iconografía)

### Backend
- **Python 3**
- **FastAPI** (Framework web asíncrono de alto rendimiento)
- **Uvicorn** (Servidor ASGI)
- **Google GenAI SDK** (Integración con el modelo `gemini-2.5-flash`)
- **Server-Sent Events (SSE)** (Protocolo de comunicación unidireccional para el streaming)

---

## 📂 Estructura del Proyecto

```text
MentzerMind/
├── public/                 # Assets estáticos
├── src/                    # Código fuente del Frontend (React)
│   ├── components/         # Componentes de la interfaz (ChatInterface)
│   ├── App.jsx             # Componente raíz
│   └── main.jsx            # Punto de entrada de React
├── server/                 # Código fuente del Backend (FastAPI)
│   ├── services/           # Módulos de integración de IA (gemini, openai, local)
│   ├── main.py             # Enrutador principal y lógica de streaming
│   ├── requirements.txt    # Dependencias de Python
│   └── .env                # Variables de entorno (API Keys, Prompts)
├── package.json            # Dependencias de Node.js
└── vite.config.js          # Configuración de Vite
```

---

## ⚙️ Instalación y Configuración

### Requisitos Previos
- Node.js (v18 o superior)
- Python 3.10+ (Se recomienda usar Conda o venv)
- Una API Key de Google Gemini (o de OpenAI)

### 1. Configuración del Backend

1. Abre una terminal y navega a la carpeta del servidor:
   ```bash
   cd server
   ```
2. Activa tu entorno virtual (ej. Conda):
   ```bash
   conda activate MentzerMind
   ```
3. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Configura las variables de entorno. Crea o edita el archivo `server/.env` con lo siguiente:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=tu_api_key_aqui
   GEMINI_TEMPERATURE=0.3
   GEMINI_MAX_TOKENS=2000
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   uvicorn main:app --reload
   ```
   El backend estará corriendo en `http://127.0.0.1:8000`.

### 2. Configuración del Frontend

1. Abre una nueva terminal en la raíz del proyecto (`MentzerMind/`).
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la dirección que indique Vite (usualmente `http://localhost:5173`).

---

## 🧠 Sobre la Filosofía "Heavy Duty"

El sistema está programado para defender los principios de Mike Mentzer:
- **Intensidad Máxima:** Llevar las series al fallo muscular absoluto.
- **Volumen Bajo:** Realizar 1 o 2 series efectivas por ejercicio.
- **Recuperación:** Entrenar con menor frecuencia para permitir que el sistema nervioso y muscular se adapte y crezca.

---

## 🔮 Trabajo Futuro (Roadmap)
- **RAG (Retrieval-Augmented Generation):** Integración de una base de datos vectorial con los libros originales de Mike Mentzer para respuestas aún más precisas.
- **Autenticación de Usuarios:** Para guardar historiales de rutinas y progreso personal.
- **Generación de PDFs:** Capacidad de exportar las rutinas generadas a formato PDF.

---
*Desarrollado como Proyecto Terminal - 2026*
