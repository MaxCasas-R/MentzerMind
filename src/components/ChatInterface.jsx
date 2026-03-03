import { useEffect, useRef, useState } from 'react'
import { Send, Dumbbell, Heart, Zap, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatInterface.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000'
const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`

const createMessage = (type, content) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  content,
  timestamp: new Date(),
})

const ChatInterface = () => {
  // Inicializar el estado de mensajes desde Local Storage si existe
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('mentzermind-chat-history')
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        // Convertir los strings de fecha de vuelta a objetos Date
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      } catch (e) {
        console.error('Error al cargar historial:', e)
      }
    }
    return [
      createMessage(
        'bot',
        '¡Hola! Soy MentzerMind, tu asistente personal de fitness y nutrición. ¿En qué puedo ayudarte hoy?'
      )
    ]
  })
  
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Guardar mensajes en Local Storage cada vez que cambian
  useEffect(() => {
    localStorage.setItem('mentzermind-chat-history', JSON.stringify(messages))
  }, [messages])

  // Función para borrar el historial
  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar el historial de la conversación?')) {
      const initialMessage = [
        createMessage(
          'bot',
          '¡Hola! Soy MentzerMind. El historial ha sido borrado. ¿En qué puedo ayudarte hoy?'
        )
      ]
      setMessages(initialMessage)
      localStorage.removeItem('mentzermind-chat-history')
    }
  }

  const sendMessageToApi = async (text, currentMessages, onChunk) => {
    const context = currentMessages
      .slice(-6)
      .map(m => ({
        role: m.type === 'bot' ? 'assistant' : 'user',
        content: m.content
      }))

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        context: context 
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Error del servidor (${response.status}): ${errorBody}`)
    }

    if (!response.body) {
      throw new Error('La API no devolvió un stream válido.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || '' // El último elemento es el resto incompleto

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr === '[DONE]') return
              try {
                const data = JSON.parse(dataStr)
                if (data.text) onChunk(data.text)
                if (data.error) throw new Error(data.error)
              } catch (e) {
                console.error('Error parseando SSE:', e, 'Data:', dataStr)
              }
            }
          }
        }
        if (done) {
          // Procesar cualquier cosa que haya quedado en el buffer al terminar
          if (buffer.trim() !== '') {
            if (buffer.startsWith('data: ')) {
              const dataStr = buffer.slice(6)
              if (dataStr !== '[DONE]') {
                try {
                  const data = JSON.parse(dataStr)
                  if (data.text) onChunk(data.text)
                } catch (e) {
                  // Ignorar errores al final
                }
              }
            }
          }
          break
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim()
    if (trimmedMessage === '' || isTyping) return

    const userMessage = createMessage('user', trimmedMessage)
    const currentMessages = [...messages]
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Crear un mensaje vacío para el bot que iremos llenando
    const botMessageId = `bot-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setMessages(prev => [
      ...prev,
      { id: botMessageId, type: 'bot', content: '', timestamp: new Date() }
    ])

    try {
      await sendMessageToApi(trimmedMessage, currentMessages, (chunk) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        )
      })
    } catch (error) {
      console.error('Error al obtener respuesta del backend:', error)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: 'Hubo un problema al generar la respuesta. Por favor, intenta de nuevo en unos segundos.' }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    { icon: Dumbbell, text: 'Rutina de ejercicios', action: () => setInputMessage('Quiero una rutina de ejercicios') },
    { icon: Heart, text: 'Plan nutricional', action: () => setInputMessage('Necesito un plan nutricional') },
    { icon: Zap, text: 'Consejos fitness', action: () => setInputMessage('Dame consejos de fitness') }
  ]

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <Dumbbell className="logo-icon" />
            </div>
            <div className="title-section">
              <h1>MentzerMind</h1>
              <p>Tu asistente personal de fitness y nutrición</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={clearHistory}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: messages.length > 1 ? 1 : 0,
                pointerEvents: messages.length > 1 ? 'auto' : 'none'
              }}
              onMouseOver={e => e.target.style.background = 'rgba(255,0,0,0.2)'}
              onMouseOut={e => e.target.style.background = 'transparent'}
            >
              Borrar Chat
            </button>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>En línea</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? <Bot /> : <User />}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {message.type === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">
              <Bot />
            </div>
            <div className="message-content">
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-actions">
          <p>¿Por dónde empezamos?</p>
          <div className="action-buttons">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="action-button"
                onClick={action.action}
              >
                <action.icon className="action-icon" />
                {action.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje sobre fitness o nutrición..."
            rows="1"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={inputMessage.trim() === '' || isTyping}
            className="send-button"
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
