import { useEffect, useRef, useState } from 'react'
import { Send, Dumbbell, Heart, Zap, User, Bot } from 'lucide-react'
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
  const [messages, setMessages] = useState([
    createMessage(
      'bot',
      '¡Hola! Soy MentzerMind, tu asistente personal de fitness y nutrición. ¿En qué puedo ayudarte hoy?'
    )
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

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

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          onChunk(chunk)
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
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>En línea</span>
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
                {message.content}
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
