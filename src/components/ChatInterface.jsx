import { useState, useRef, useEffect } from 'react'
import { Send, Dumbbell, Heart, Zap, User, Bot } from 'lucide-react'
import './ChatInterface.css'

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '¡Hola! Soy MentzerMind, tu asistente personal de fitness y nutrición. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulación de respuesta del bot (aquí conectarías con tu backend)
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: getBotResponse(inputMessage),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getBotResponse = (message) => {
    // Respuestas simuladas para demostración
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('ejercicio') || lowerMessage.includes('rutina')) {
      return 'Te puedo ayudar con rutinas de ejercicio personalizadas. ¿Qué tipo de entrenamiento te interesa? ¿Fuerza, cardio, o tal vez algo específico como brazos o piernas?'
    }
    
    if (lowerMessage.includes('dieta') || lowerMessage.includes('nutrición') || lowerMessage.includes('comida')) {
      return 'Perfecto, la nutrición es clave para alcanzar tus objetivos. ¿Cuál es tu meta principal? ¿Perder peso, ganar masa muscular, o mantener un estilo de vida saludable?'
    }
    
    if (lowerMessage.includes('peso') || lowerMessage.includes('bajar') || lowerMessage.includes('adelgazar')) {
      return 'Para perder peso de manera saludable, necesitamos crear un déficit calórico combinando una dieta balanceada con ejercicio regular. ¿Cuánto peso te gustaría perder y en qué tiempo?'
    }
    
    if (lowerMessage.includes('músculo') || lowerMessage.includes('masa') || lowerMessage.includes('ganar')) {
      return 'Para ganar masa muscular necesitas un superávit calórico moderado y entrenamiento de fuerza consistente. ¿Tienes acceso a un gimnasio o prefieres entrenar en casa?'
    }
    
    return 'Entiendo tu consulta. Como parte de mi desarrollo, pronto podré darte respuestas más específicas y personalizadas. ¿Hay algo más específico sobre fitness o nutrición que te interese?'
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
