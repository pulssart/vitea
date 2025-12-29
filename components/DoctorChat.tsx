'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  Send, 
  Stethoscope, 
  Loader2, 
  Trash2, 
  AlertCircle,
  Sparkles,
  User,
  Droplets,
  Dna,
  FileText,
  MessageCircle
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Simple markdown parser for chat messages
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let listStartNumber: number | undefined = undefined

  const flushList = (startNumber?: number) => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      const listProps: any = {
        key: `list-${elements.length}`,
        className: listType === 'ul' ? 'list-disc pl-5 my-2 space-y-1' : 'list-decimal pl-5 my-2 space-y-1'
      }
      // Pour les listes ordonnées, utiliser l'attribut start si fourni
      if (listType === 'ol' && startNumber !== undefined) {
        listProps.start = startNumber
      }
      elements.push(
        <ListTag {...listProps}>
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
      listStartNumber = undefined // Réinitialiser pour la prochaine liste
    }
  }

  const parseInline = (line: string): React.ReactNode => {
    // Parse inline elements: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      // Italic *text*
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
      // Code `text`
      const codeMatch = remaining.match(/`(.+?)`/)
      
      // Find earliest match
      const matches = [
        { match: boldMatch, type: 'bold' },
        { match: italicMatch, type: 'italic' },
        { match: codeMatch, type: 'code' },
      ].filter(m => m.match !== null)
      
      if (matches.length === 0) {
        parts.push(remaining)
        break
      }

      // Sort by index
      matches.sort((a, b) => (a.match?.index || 0) - (b.match?.index || 0))
      const earliest = matches[0]
      const match = earliest.match!
      const index = match.index!

      // Add text before match
      if (index > 0) {
        parts.push(remaining.slice(0, index))
      }

      // Add formatted element
      if (earliest.type === 'bold') {
        parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>)
      } else if (earliest.type === 'italic') {
        parts.push(<em key={key++} className="italic">{match[1]}</em>)
      } else if (earliest.type === 'code') {
        parts.push(<code key={key++} className="px-1.5 py-0.5 bg-surface-alt rounded text-sm font-mono">{match[1]}</code>)
      }

      remaining = remaining.slice(index + match[0].length)
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Headers
    if (line.startsWith('### ')) {
      flushList(listStartNumber)
      elements.push(<h4 key={`h4-${i}`} className="font-semibold text-text-primary mt-3 mb-1">{parseInline(line.slice(4))}</h4>)
      continue
    }
    if (line.startsWith('## ')) {
      flushList(listStartNumber)
      elements.push(<h3 key={`h3-${i}`} className="font-semibold text-text-primary text-lg mt-3 mb-1">{parseInline(line.slice(3))}</h3>)
      continue
    }
    if (line.startsWith('# ')) {
      flushList(listStartNumber)
      elements.push(<h2 key={`h2-${i}`} className="font-bold text-text-primary text-xl mt-3 mb-2">{parseInline(line.slice(2))}</h2>)
      continue
    }

    // Unordered list
    if (line.match(/^[-*•]\s/)) {
      if (listType !== 'ul') {
        flushList(listStartNumber)
        listType = 'ul'
        listStartNumber = undefined
      }
      listItems.push(line.replace(/^[-*•]\s/, ''))
      continue
    }

    // Ordered list
    const orderedMatch = line.match(/^(\d+)\.\s/)
    if (orderedMatch) {
      const number = parseInt(orderedMatch[1], 10)
      if (listType !== 'ol') {
        flushList(listStartNumber)
        listType = 'ol'
        listStartNumber = number // Sauvegarder le numéro de départ
      }
      listItems.push(line.replace(/^\d+\.\s/, ''))
      continue
    }

    // Empty line
    if (line.trim() === '') {
      flushList(listStartNumber)
      elements.push(<div key={`br-${i}`} className="h-2" />)
      continue
    }

    // Regular paragraph
    flushList(listStartNumber)
    elements.push(<p key={`p-${i}`} className="my-1">{parseInline(line)}</p>)
  }

  flushList(listStartNumber)
  return <div className="space-y-0.5">{elements}</div>
}

// Memoized message content component
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parsed = useMemo(() => {
    if (isUser) return content
    return parseMarkdown(content)
  }, [content, isUser])

  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>
  }

  return <>{parsed}</>
}

const suggestedQuestions = [
  "Quels sont mes points forts selon mes analyses ?",
  "Que dois-je surveiller en priorité ?",
  "Comment améliorer mon taux de cholestérol ?",
  "Mon profil génétique influence-t-il mon métabolisme ?",
  "Quels aliments me recommandes-tu ?",
  "Quel sport est adapté à mon profil ADN ?",
]

interface DoctorChatProps {
  isPopup?: boolean
}

export default function DoctorChat({ isPopup = false }: DoctorChatProps = {}) {
  const { profile, analyses, dnaAnalyses, healthPlan, chatMessages, setChatMessages, addChatMessage, clearChatMessages } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isProcessingRef = useRef(false) // Protection contre les appels multiples

  const latestBlood = analyses[0]
  const latestDNA = dnaAnalyses[0]

  const hasContext = latestBlood || latestDNA

  // Charger les messages depuis le store au montage et quand le store change
  useEffect(() => {
    // Charger uniquement si on n'a pas de messages locaux ou si le store a plus de messages
    if (chatMessages.length > 0) {
      const loadedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      
      // Comparer les IDs pour éviter de recharger si c'est identique
      const currentIds = messages.map(m => m.id).join(',')
      const loadedIds = loadedMessages.map(m => m.id).join(',')
      
      // Charger si différent ou si on n'a pas encore de messages locaux
      if (currentIds !== loadedIds || messages.length === 0) {
        setMessages(loadedMessages)
      }
    }
  }, [chatMessages, messages])

  // Sauvegarder les messages dans le store quand ils changent
  // Note: Les messages sont aussi sauvegardés immédiatement dans handleSend et les handlers de streaming
  // Ce useEffect sert de sauvegarde de secours
  useEffect(() => {
    // Ne sauvegarder que si les messages ont vraiment changé
    if (messages.length > 0) {
      const messagesToSave = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))
      
      // Comparer les IDs pour éviter les sauvegardes inutiles
      const currentIds = chatMessages.map(m => m.id).join(',')
      const newIds = messagesToSave.map(m => m.id).join(',')
      
      // Sauvegarder seulement si les IDs sont différents (nouveaux messages ou ordre différent)
      if (currentIds !== newIds) {
        setChatMessages(messagesToSave)
      }
    }
  }, [messages, chatMessages, setChatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    
    // Protection contre les appels multiples
    if (isProcessingRef.current) {
      console.log('Déjà en cours de traitement, ignore la requête')
      return
    }
    
    if (!messageText || isLoading || isStreaming) return
    if (!profile?.openaiKey) {
      setError('Clé API OpenAI requise dans les paramètres')
      return
    }

    // Marquer comme en cours de traitement
    isProcessingRef.current = true

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      // Sauvegarder immédiatement le message utilisateur
      setChatMessages(newMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      })))
      return newMessages
    })
    setInput('')
    setError(null)
    setStreamingMessage('...')

    // Simuler un délai d'écriture avant de commencer le streaming
    await new Promise(resolve => setTimeout(resolve, 800))

    let streamEndedWithDone = false // Flag pour savoir si le stream s'est terminé avec [DONE]

    try {
      const response = await fetch('/api/doctor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          bloodAnalysis: latestBlood,
          dnaAnalysis: latestDNA,
          healthPlan,
          profile,
          apiKey: profile.openaiKey,
          stream: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur de communication')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let buffer = ''

      if (!reader) {
        throw new Error('Impossible de lire la réponse')
      }

      // Fonction pour diviser le texte en plusieurs messages
      const splitIntoMessages = (text: string): string[] => {
        const messages: string[] = []
        const minLength = 300 // Longueur minimale par message
        const maxLength = 800 // Longueur maximale par message
        
        // Diviser par paragraphes d'abord
        const paragraphs = text.split(/\n\n+/)
        let currentMessage = ''
        
        for (const paragraph of paragraphs) {
          const trimmedParagraph = paragraph.trim()
          if (!trimmedParagraph) continue
          
          // Si le paragraphe seul dépasse maxLength, le diviser
          if (trimmedParagraph.length > maxLength) {
            // Sauvegarder le message actuel s'il existe
            if (currentMessage.length >= minLength) {
              messages.push(currentMessage.trim())
              currentMessage = ''
            }
            
            // Diviser le long paragraphe par phrases
            const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/)
            for (const sentence of sentences) {
              if (currentMessage.length + sentence.length > maxLength && currentMessage.length >= minLength) {
                messages.push(currentMessage.trim())
                currentMessage = sentence
              } else {
                currentMessage += (currentMessage ? ' ' : '') + sentence
              }
            }
          } else {
            // Si ajouter ce paragraphe dépasse maxLength, sauvegarder le message actuel
            if (currentMessage.length + trimmedParagraph.length > maxLength && currentMessage.length >= minLength) {
              messages.push(currentMessage.trim())
              currentMessage = trimmedParagraph
            } else {
              currentMessage += (currentMessage ? '\n\n' : '') + trimmedParagraph
            }
          }
        }
        
        // Ajouter le dernier message s'il existe
        if (currentMessage.trim()) {
          messages.push(currentMessage.trim())
        }
        
        return messages.length > 0 ? messages : [text]
      }

      let completedMessages: string[] = []
      let currentMessageBuffer = ''
      let isWaitingForNewBubble = false
      let pendingContentDuringWait = ''
      let messagesAlreadyCreated = new Set<string>() // Pour éviter les doublons

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Fin du stream - finaliser le dernier message
              // Ne pas recréer les messages qui ont déjà été créés pendant le streaming
              // Ils sont déjà dans completedMessages et ont été créés
              if (currentMessageBuffer.trim()) {
                const finalMessages = splitIntoMessages(currentMessageBuffer)
                // Ne créer que les messages qui n'ont pas déjà été créés
                for (const msgContent of finalMessages) {
                  if (!messagesAlreadyCreated.has(msgContent)) {
                    messagesAlreadyCreated.add(msgContent)
                    const assistantMessage: Message = {
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: msgContent,
                      timestamp: new Date(),
                    }
                    setMessages(prev => {
                      // Vérifier aussi dans l'état actuel pour éviter les doublons
                      const exists = prev.some(m => m.content === msgContent && m.role === 'assistant')
                      if (exists) return prev
                      const newMessages = [...prev, assistantMessage]
                      // Sauvegarder immédiatement
                      setChatMessages(newMessages.map(msg => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp.toISOString()
                      })))
                      return newMessages
                    })
                  }
                }
              }
              
              setStreamingMessage('')
              setIsStreaming(false)
              setIsLoading(false)
              isProcessingRef.current = false // Réinitialiser le flag
              streamEndedWithDone = true // Marquer que le stream s'est terminé avec [DONE]
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                // Si on est en train d'attendre (délai de 750ms), accumuler dans le buffer temporaire
                if (isWaitingForNewBubble) {
                  pendingContentDuringWait += parsed.content
                  continue
                }
                
                // Si c'est le premier contenu, remplacer les "..."
                if (accumulatedText === '' && streamingMessage === '...') {
                  accumulatedText = parsed.content
                  currentMessageBuffer = parsed.content
                } else {
                  accumulatedText += parsed.content
                  currentMessageBuffer += parsed.content
                }
                
                // Vérifier si on doit créer un nouveau message (seuil: 600 caractères)
                if (currentMessageBuffer.length >= 600) {
                  const messages = splitIntoMessages(currentMessageBuffer)
                  
                  // Ajouter tous les messages sauf le dernier (qui continue à streamer)
                  for (let i = 0; i < messages.length - 1; i++) {
                    const msgContent = messages[i]
                    // Vérifier que le message n'a pas déjà été créé
                    if (!messagesAlreadyCreated.has(msgContent)) {
                      messagesAlreadyCreated.add(msgContent)
                      completedMessages.push(msgContent)
                      const assistantMessage: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: msgContent,
                        timestamp: new Date(),
                      }
                      setMessages(prev => {
                        // Vérifier aussi dans l'état actuel pour éviter les doublons
                        const exists = prev.some(m => m.content === msgContent && m.role === 'assistant')
                        if (exists) return prev
                        const newMessages = [...prev, assistantMessage]
                        // Sauvegarder immédiatement
                        setChatMessages(newMessages.map(msg => ({
                          id: msg.id,
                          role: msg.role,
                          content: msg.content,
                          timestamp: msg.timestamp.toISOString()
                        })))
                        return newMessages
                      })
                    }
                  }
                  
                  // Garder le dernier message dans le buffer pour continuer
                  currentMessageBuffer = messages[messages.length - 1] || ''
                  
                  // Simuler un délai d'écriture avec "..." avant de commencer la nouvelle bulle
                  isWaitingForNewBubble = true
                  pendingContentDuringWait = ''
                  setStreamingMessage('...')
                  
                  // Attendre 750ms de manière asynchrone
                  setTimeout(() => {
                    // Après le délai, ajouter le contenu accumulé et reprendre
                    if (pendingContentDuringWait) {
                      currentMessageBuffer += pendingContentDuringWait
                      accumulatedText += pendingContentDuringWait
                    }
                    isWaitingForNewBubble = false
                    pendingContentDuringWait = ''
                    setStreamingMessage(currentMessageBuffer)
                  }, 750)
                } else {
                  setStreamingMessage(currentMessageBuffer)
                }
              }
            } catch (e) {
              // Ignore les erreurs de parsing
            }
          }
        }
      }

      // Finaliser le dernier message s'il reste quelque chose
      // Ne s'exécuter que si le stream ne s'est pas terminé avec [DONE]
      if (!streamEndedWithDone && currentMessageBuffer.trim()) {
        const finalMessages = splitIntoMessages(currentMessageBuffer)
        for (const msgContent of finalMessages) {
          // Vérifier que le message n'a pas déjà été créé
          if (!messagesAlreadyCreated.has(msgContent)) {
            messagesAlreadyCreated.add(msgContent)
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: msgContent,
              timestamp: new Date(),
            }
            setMessages(prev => {
              // Vérifier aussi dans l'état actuel pour éviter les doublons
              const exists = prev.some(m => m.content === msgContent && m.role === 'assistant')
              if (exists) return prev
              const newMessages = [...prev, assistantMessage]
              // Sauvegarder immédiatement
              setChatMessages(newMessages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp.toISOString()
              })))
              return newMessages
            })
          }
        }
      }
      setStreamingMessage('')
      
      // S'assurer que le flag est réinitialisé même si le stream se termine normalement
      if (!streamEndedWithDone) {
        isProcessingRef.current = false
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la communication')
      isProcessingRef.current = false // Réinitialiser le flag en cas d'erreur
      streamEndedWithDone = false // Réinitialiser aussi ce flag
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingMessage('')
      // Le flag est déjà réinitialisé dans les blocs ci-dessus, mais on s'assure ici aussi
      if (!streamEndedWithDone) {
        isProcessingRef.current = false
      }
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    clearChatMessages()
    setError(null)
  }

  return (
    <div className={`${isPopup ? 'h-full' : 'fixed inset-0 top-16'} bg-background flex flex-col`}>
      {/* Subtle Header Bar */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-dark flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Dr. Vitea</h2>
            <div className="flex items-center gap-2">
              {latestBlood && (
                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                  <Droplets className="w-3 h-3 text-red-400" />
                  Sang
                </span>
              )}
              {latestDNA && (
                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                  <Dna className="w-3 h-3 text-purple-400" />
                  ADN
                </span>
              )}
              {healthPlan && (
                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                  <FileText className="w-3 h-3 text-accent-primary" />
                  Plan
                </span>
              )}
              {!hasContext && (
                <span className="text-xs text-text-muted">Aucune analyse chargée</span>
              )}
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted hover:text-text-primary"
            title="Nouvelle conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area - Full Height */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-dark flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-3">
                Bonjour {profile?.firstName || ''} ! 👋
              </h3>
              <p className="text-text-secondary mb-8 max-w-md text-lg">
                Je suis Dr. Vitea, votre assistant santé personnalisé. Posez-moi n'importe quelle question sur vos analyses.
              </p>
              
              {/* Context badges */}
              {hasContext && (
                <div className="flex items-center gap-3 mb-8">
                  {latestBlood && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200">
                      <Droplets className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">Analyse sang chargée</span>
                    </div>
                  )}
                  {latestDNA && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
                      <Dna className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-700">Analyse ADN chargée</span>
                    </div>
                  )}
                  {healthPlan && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-secondary border border-accent-primary/20">
                      <FileText className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm text-accent-primary">Plan santé chargé</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Suggested questions */}
              <div className="w-full max-w-2xl">
                <p className="text-sm text-text-muted mb-4">Commencez par une question :</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      disabled={isLoading || !profile?.openaiKey}
                      className="text-left p-4 rounded-xl bg-surface border border-border hover:border-accent-primary hover:shadow-md
                        transition-all text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 group"
                    >
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-text-muted group-hover:text-accent-primary flex-shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-dark flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-alt border-2 border-border flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block max-w-[85%] rounded-2xl px-5 py-3 ${
                        msg.role === 'user'
                          ? 'bg-accent-primary text-white rounded-tr-md'
                          : 'bg-surface border border-border text-text-primary rounded-tl-md'
                      }`}
                    >
                      <div className="text-[15px] leading-relaxed text-left">
                        <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                      </div>
                    </div>
                    <div className={`text-xs text-text-muted mt-1 ${msg.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {(isLoading || isStreaming) && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-primary-dark flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {isStreaming && streamingMessage ? (
                      <div className="inline-block bg-surface border border-border rounded-2xl rounded-tl-md px-5 py-3 max-w-[85%]">
                        <div className="text-[15px] leading-relaxed text-text-primary">
                          <MessageContent content={streamingMessage} isUser={false} />
                          <span 
                            className="inline-block w-0.5 h-4 bg-accent-primary ml-1 align-middle cursor-blink-animation" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-block bg-surface border border-border rounded-2xl rounded-tl-md px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm text-text-muted">Dr. Vitea réfléchit...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Input Area - Fixed Bottom */}
      <div className="bg-surface border-t border-border px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {!profile?.openaiKey ? (
            <div className="text-center py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-700 text-sm">
                ⚠️ Configurez votre clé API OpenAI dans les paramètres pour utiliser le chat.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question au Dr. Vitea..."
                  rows={1}
                  className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border resize-none 
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary 
                    text-text-primary placeholder:text-text-muted text-[15px] leading-relaxed"
                  style={{ minHeight: '52px', maxHeight: '150px' }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-3.5 bg-accent-primary text-white rounded-xl hover:bg-accent-primary-dark 
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
          <p className="text-xs text-text-muted text-center mt-3">
            Dr. Vitea peut faire des erreurs. Consultez un professionnel de santé pour les décisions importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
