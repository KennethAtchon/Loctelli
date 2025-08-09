"use client"

import "ios-vibrator-pro-max"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Search,
  Plus,
  Lightbulb,
  ArrowUp,
  RefreshCcw,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ActiveButton = "none" | "add" | "deepSearch" | "think"
type MessageType = "user" | "system"

export interface Message {
  id: string
  content: string
  type: MessageType
  completed?: boolean
  newSection?: boolean
}

export interface ChatInterfaceConfig {
  // Layout configuration
  showHeader?: boolean
  headerTitle?: string
  headerSubtitle?: string
  headerIcon?: React.ReactNode
  
  // Input configuration
  placeholder?: string
  disabledPlaceholder?: string
  showActionButtons?: boolean
  showAddButton?: boolean
  showDeepSearchButton?: boolean
  showThinkButton?: boolean
  
  // Message configuration
  showMessageActions?: boolean
  showTimestamps?: boolean
  
  // Behavior configuration
  autoFocus?: boolean
  enableKeyboardShortcuts?: boolean
  maxHeight?: string | number
  
  // Styling
  variant?: 'default' | 'compact' | 'minimal'
  theme?: 'light' | 'dark'
}

export interface ChatInterfaceProps {
  messages?: Message[]
  onSendMessage?: (message: string) => void
  isStreaming?: boolean
  className?: string
  config?: ChatInterfaceConfig
  disabled?: boolean
  loading?: boolean
}

interface MessageSection {
  id: string
  messages: Message[]
  isNewSection: boolean
  isActive?: boolean
  sectionIndex: number
}

interface StreamingWord {
  id: number
  text: string
}

// Faster word delay for smoother streaming
const WORD_DELAY = 40 // ms per word
const CHUNK_SIZE = 2 // Number of words to add at once

export default function ChatInterface({ 
  messages: externalMessages = [], 
  onSendMessage, 
  isStreaming: externalIsStreaming = false,
  className,
  config = {},
  disabled = false,
  loading = false
}: ChatInterfaceProps) {
  // Default configuration
  const defaultConfig: Required<ChatInterfaceConfig> = {
    showHeader: false,
    headerTitle: "Chat",
    headerSubtitle: "AI Assistant",
    headerIcon: null,
    placeholder: "Ask Anything",
    disabledPlaceholder: "Waiting for response...",
    showActionButtons: true,
    showAddButton: true,
    showDeepSearchButton: true,
    showThinkButton: true,
    showMessageActions: true,
    showTimestamps: false,
    autoFocus: true,
    enableKeyboardShortcuts: true,
    maxHeight: "100%",
    variant: "default",
    theme: "light"
  }
  
  // Merge user config with defaults
  const finalConfig = { ...defaultConfig, ...config }
  const [inputValue, setInputValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const newSectionRef = useRef<HTMLDivElement>(null)
  const [hasTyped, setHasTyped] = useState(false)
  const [activeButton, setActiveButton] = useState<ActiveButton>("none")
  const [messageSections, setMessageSections] = useState<MessageSection[]>([])
  const [isStreaming, setIsStreaming] = useState(externalIsStreaming)
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const shouldFocusAfterStreamingRef = useRef(false)
  // Store selection state
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })

  // Update internal streaming state when external prop changes
  useEffect(() => {
    setIsStreaming(externalIsStreaming)
  }, [externalIsStreaming])

  // Organize messages into sections
  useEffect(() => {
    if (externalMessages.length === 0) {
      setMessageSections([])
      setActiveSectionId(null)
      return
    }

    const sections: MessageSection[] = []
    let currentSection: MessageSection = {
      id: `section-${Date.now()}-0`,
      messages: [],
      isNewSection: false,
      sectionIndex: 0,
    }

    externalMessages.forEach((message) => {
      if (message.newSection) {
        // Start a new section
        if (currentSection.messages.length > 0) {
          // Mark previous section as inactive
          sections.push({
            ...currentSection,
            isActive: false,
          })
        }

        // Create new active section
        const newSectionId = `section-${Date.now()}-${sections.length}`
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        }

        // Update active section ID
        setActiveSectionId(newSectionId)
      } else {
        // Add to current section
        currentSection.messages.push(message)
      }
    })

    // Add the last section if it has messages
    if (currentSection.messages.length > 0) {
      sections.push(currentSection)
    }

    setMessageSections(sections)
  }, [externalMessages])

  // Scroll to maximum position when new section is created, but only for sections after the first
  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current

        if (scrollContainer) {
          // Scroll to maximum possible position
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messageSections])

  // Focus the textarea on component mount based on config
  useEffect(() => {
    if (finalConfig.autoFocus && textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [finalConfig.autoFocus, disabled])

  // Set focus back to textarea after streaming ends
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current) {
      focusTextarea()
      shouldFocusAfterStreamingRef.current = false
    }
  }, [isStreaming])

  // Save the current selection state
  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      }
    }
  }

  // Restore the saved selection state
  const restoreSelectionState = () => {
    const textarea = textareaRef.current
    const { start, end } = selectionStateRef.current

    if (textarea && start !== null && end !== null) {
      // Focus first, then set selection range
      textarea.focus()
      textarea.setSelectionRange(start, end)
    } else if (textarea) {
      // If no selection was saved, just focus
      textarea.focus()
    }
  }

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current && !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Only allow input changes when not streaming and not disabled
    if (!isStreaming && !disabled && !loading) {
      setInputValue(newValue)

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true)
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false)
      }

      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160))
        textarea.style.height = `${newHeight}px`
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isStreaming && !disabled && !loading && onSendMessage) {
      // Add vibration when message is submitted
      navigator.vibrate(50)

      const userMessage = inputValue.trim()

      // Reset input before sending
      setInputValue("")
      setHasTyped(false)
      setActiveButton("none")

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Focus the textarea
      focusTextarea()

      // Send message via callback
      onSendMessage(userMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!finalConfig.enableKeyboardShortcuts || disabled || loading) return
    
    // Handle Cmd+Enter or Ctrl+Enter
    if (!isStreaming && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Handle regular Enter key (without Shift)
    if (!isStreaming && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleButton = (button: ActiveButton) => {
    if (!isStreaming && !disabled && !loading) {
      // Save the current selection state before toggling
      saveSelectionState()

      setActiveButton((prev) => (prev === button ? "none" : button))

      // Restore the selection state after toggling
      setTimeout(() => {
        restoreSelectionState()
      }, 0)
    }
  }

  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id)

    return (
      <div key={message.id} className={cn("flex flex-col", message.type === "user" ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl",
            message.type === "user" ? "bg-white border border-gray-200 rounded-br-none" : "text-gray-900",
          )}
        >
          {/* For user messages or completed system messages, render without animation */}
          {message.content && (
            <span className={message.type === "system" && !isCompleted ? "animate-fade-in" : ""}>
              {message.content}
            </span>
          )}

          {/* For streaming messages, render with animation */}
          {message.id === streamingMessageId && (
            <span className="inline">
              {streamingWords.map((word) => (
                <span key={word.id} className="animate-fade-in inline">
                  {word.text}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Message actions */}
        {finalConfig.showMessageActions && message.type === "system" && message.completed && (
          <div className="flex items-center gap-2 px-4 mt-1 mb-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }


  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Optional Header */}
      {finalConfig.showHeader && (
        <div className="flex-shrink-0 p-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            {finalConfig.headerIcon && (
              <div className="flex-shrink-0">
                {finalConfig.headerIcon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{finalConfig.headerTitle}</h3>
              {finalConfig.headerSubtitle && (
                <p className="text-sm text-gray-600">{finalConfig.headerSubtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto ">
        <div className="space-y-4">
          {messageSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              ref={sectionIndex === messageSections.length - 1 && section.isNewSection ? newSectionRef : null}
            >
              {section.isNewSection && (
                <div className="pt-4 flex flex-col justify-start">
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}

              {!section.isNewSection && <div>{section.messages.map((message) => renderMessage(message))}</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSubmit}>
          <div
            ref={inputContainerRef}
            className={cn(
              "relative w-full rounded-3xl border border-gray-200 bg-white p-3 cursor-text",
              (isStreaming || disabled || loading) && "opacity-80",
            )}
            onClick={handleInputContainerClick}
          >
            <div className={cn("pb-9", !finalConfig.showActionButtons && "pb-2")}>
              <Textarea
                ref={textareaRef}
                placeholder={
                  isStreaming || disabled || loading 
                    ? finalConfig.disabledPlaceholder 
                    : finalConfig.placeholder
                }
                className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={disabled || loading}
                onFocus={() => {
                  // Ensure the textarea is scrolled into view when focused
                  if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }}
              />
            </div>

            {finalConfig.showActionButtons && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {finalConfig.showAddButton && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={cn(
                          "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                          activeButton === "add" && "bg-gray-100 border-gray-300",
                        )}
                        onClick={() => toggleButton("add")}
                        disabled={isStreaming || disabled || loading}
                      >
                        <Plus className={cn("h-4 w-4 text-gray-500", activeButton === "add" && "text-gray-700")} />
                        <span className="sr-only">Add</span>
                      </Button>
                    )}

                    {finalConfig.showDeepSearchButton && (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "rounded-full h-8 px-3 flex items-center border-gray-200 gap-1.5 transition-colors",
                          activeButton === "deepSearch" && "bg-gray-100 border-gray-300",
                        )}
                        onClick={() => toggleButton("deepSearch")}
                        disabled={isStreaming || disabled || loading}
                      >
                        <Search className={cn("h-4 w-4 text-gray-500", activeButton === "deepSearch" && "text-gray-700")} />
                        <span className={cn("text-gray-900 text-sm", activeButton === "deepSearch" && "font-medium")}>
                          DeepSearch
                        </span>
                      </Button>
                    )}

                    {finalConfig.showThinkButton && (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "rounded-full h-8 px-3 flex items-center border-gray-200 gap-1.5 transition-colors",
                          activeButton === "think" && "bg-gray-100 border-gray-300",
                        )}
                        onClick={() => toggleButton("think")}
                        disabled={isStreaming || disabled || loading}
                      >
                        <Lightbulb className={cn("h-4 w-4 text-gray-500", activeButton === "think" && "text-gray-700")} />
                        <span className={cn("text-gray-900 text-sm", activeButton === "think" && "font-medium")}>
                          Think
                        </span>
                      </Button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                      hasTyped ? "bg-black scale-110" : "bg-gray-200",
                    )}
                    disabled={!inputValue.trim() || isStreaming || disabled || loading}
                  >
                    <ArrowUp className={cn("h-4 w-4 transition-colors", hasTyped ? "text-white" : "text-gray-500")} />
                    <span className="sr-only">Submit</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Always show submit button even when action buttons are hidden */}
            {!finalConfig.showActionButtons && (
              <div className="absolute bottom-3 right-3">
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                    hasTyped ? "bg-black scale-110" : "bg-gray-200",
                  )}
                  disabled={!inputValue.trim() || isStreaming || disabled || loading}
                >
                  <ArrowUp className={cn("h-4 w-4 transition-colors", hasTyped ? "text-white" : "text-gray-500")} />
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
