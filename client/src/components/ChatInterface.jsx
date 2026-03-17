import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { AlertCircle, Bot, Sparkles, Loader2, Send } from "lucide-react";
import { useStage, usePlayer } from "@empirica/core/player/classic/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "./ai-elements/conversation";
import { Message, MessageContent } from "./ai-elements/message";
import { apiFetch } from "@/utils/api";
import LoadingDistraction from "./LoadingDistraction";

// Memoized markdown component to prevent unnecessary re-renders
const MarkdownContent = React.memo(({ content }) => (
  <div className="markdown-streaming">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
      {content || ""}
    </ReactMarkdown>
  </div>
));

/**
 * ChatInterface Component
 *
 * Provides a chat interface for interacting with the LLM.
 * Videos have been pre-processed during Preparation stage.
 * Automatically detects when new videos are watched and notifies user.
 *
 * Props:
 * - allVideos: Array of all available video objects (processed during prep)
 * - watchedVideos: Array of video objects that have been watched
 * - enabled: Boolean indicating if chat is enabled (treatment dependent)
 * - onMessageSent: Callback when a message is sent (for logging)
 */
export default function ChatInterface({ allVideos = [], watchedVideos = [], enabled = true, onMessageSent }) {
  const stage = useStage();
  const player = usePlayer();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [previousVideoCount, setPreviousVideoCount] = useState(0);
  const conversationRef = useRef(null);
  const textareaRef = useRef(null);

  // Get treatment configuration
  const chatHasVideoContext = stage?.get("chatHasVideoContext") !== false; // Default to true
  const wrongAnswersMode = stage?.get("wrongAnswersMode") || false; // Wrong answers mode (round 3 only)

  // Detect when new videos are watched and notify user
  useEffect(() => {
    if (watchedVideos.length > previousVideoCount && previousVideoCount > 0 && messages.length > 0) {
      // User watched new video(s) after already chatting
      const newVideoCount = watchedVideos.length - previousVideoCount;
      const notification = {
        role: "system",
        content: `✓ You watched ${newVideoCount} new video${newVideoCount > 1 ? 's' : ''}. ${chatHasVideoContext ? 'The AI will include them in the next response.' : ''}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, notification]);
    }
    setPreviousVideoCount(watchedVideos.length);
  }, [watchedVideos.length, previousVideoCount, messages.length, chatHasVideoContext]);

  // Starter prompts based on video context
  const starterPrompts = chatHasVideoContext
    ? [
      "Summarize the key points from the videos",
      "What are the main arguments presented?",
      "Compare the different perspectives",
      "What evidence was provided?",
    ]
    : [
      "What can you tell me about this topic?",
      "Can you help me understand this better?",
      "What are different viewpoints on this?",
    ];

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    textareaRef.current?.focus();
    setError(null);
    setShowSuggestions(false);

    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      videoIds: watchedVideos.map(v => v.id),
    };

    if (onMessageSent) {
      onMessageSent({
        ...newUserMessage,
        watchedVideoIds: watchedVideos.map(v => v.id),
      });
    }

    setIsLoading(true);
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const videoCacheName = player?.get("videoCacheName") || null;

      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          watchedVideos: watchedVideos.map(video => ({
            id: video.id,
            title: video.title,
            url: video.url,
          })),
          allVideos: allVideos.map(video => ({
            id: video.id,
            title: video.title,
            url: video.url,
          })),
          conversationHistory: messages,
          includeVideoContext: chatHasVideoContext,
          videoCacheName,
          playerId: player?.id || null,
          wrongAnswersMode: wrongAnswersMode, // Wrong answers mode (round 3 only)
        }),
      });

      if (!response.ok) {
        // Special handling for 503 Overloaded error
        if (response.status === 503) {
          throw new Error("The AI model is currently overloaded. Please wait a moment and try again.");
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let assistantMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                const chunkContent = data.content;
                fullText += chunkContent;

                if (!assistantMessageAdded) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: fullText,
                      timestamp: new Date().toISOString(),
                      isStreaming: true,
                    },
                  ]);
                  assistantMessageAdded = true;
                } else {
                  setMessages((prev) => {
                    const lastIndex = prev.length - 1;
                    if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
                      // Only update if content actually changed to prevent unnecessary re-renders
                      if (prev[lastIndex].content === fullText) {
                        return prev;
                      }
                      const newMessages = [...prev];
                      newMessages[lastIndex] = {
                        ...prev[lastIndex],
                        content: fullText,
                      };
                      return newMessages;
                    }
                    return prev;
                  });
                }
              } else if (data.type === "done") {
                fullText = data.fullText || fullText;

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
                    newMessages[lastIndex] = {
                      role: "assistant",
                      content: fullText,
                      timestamp: data.timestamp,
                      isStreaming: false,
                    };
                  }
                  return newMessages;
                });

                if (onMessageSent) {
                  onMessageSent({
                    role: "assistant",
                    content: fullText,
                    timestamp: new Date().toISOString(),
                  });
                }
              } else if (data.type === "error") {
                throw new Error(data.message || "Streaming error");
              }
            } catch (parseError) {
              // Ignore malformed SSE data lines
            }
          }
        }
      }
    } catch (err) {
      // Cleaner error message for users
      let displayError = err.message || "Failed to get response. Please try again.";
      if (displayError.includes("503") || displayError.includes("overloaded")) {
        displayError = "The AI model is currently overloaded. Please wait a moment and try again.";
      }

      setError(displayError);

      setMessages((prev) => prev.slice(0, -1));
      setInputValue(userMessage);
      textareaRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterPromptClick = (prompt) => {
    setInputValue(prompt);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!enabled) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 p-8">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chat Not Available</p>
          <p className="text-sm mt-2">This feature is not enabled for your session</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white text-card-foreground shadow-sm">
      <div className="border-b bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold leading-tight">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">
                {chatHasVideoContext
                  ? "Video-aware"
                  : "General knowledge"}
              </p>
            </div>
          </div>
          <Badge variant={chatHasVideoContext ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-5">
            {chatHasVideoContext ? "Video" : "Text"}
          </Badge>
        </div>
        {chatHasVideoContext && watchedVideos.length > 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Includes {watchedVideos.length} video{watchedVideos.length === 1 ? "" : "s"} watched
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1 rounded-none border-0 bg-transparent">
          <ConversationContent
            ref={conversationRef}
            className="space-y-3 px-3 py-3 text-xs"
          >

            {messages.map((message, index) => (
              <Message key={index} from={message.role} className="gap-2">
                <MessageContent
                  className={
                    message.role === "assistant"
                      ? "bg-muted text-foreground leading-normal py-1.5 px-3"
                      : message.role === "user"
                        ? "text-left py-1.5 px-3"
                        : undefined
                  }
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MarkdownContent content={message.content} />
                  )}
                </MessageContent>
              </Message>
            ))}

            {isLoading && (messages.length === 0 || messages[messages.length - 1].role !== "assistant" || !messages[messages.length - 1].isStreaming) && (
              <Message from="assistant" className="gap-2">
                <MessageContent className="bg-muted text-foreground py-1.5 px-3">
                  <LoadingDistraction />
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
        </Conversation>

        <div className="border-t border-dashed border-border/50 bg-muted/30 px-3 py-2">
          {showSuggestions ? (
            <>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Example questions</span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    Hide
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleStarterPromptClick(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowSuggestions(true)}
              className="w-full rounded-lg border border-border/70 bg-white px-2 py-1.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/5"
            >
              Show example questions
            </button>
          )}
        </div>

        {error && (
          <div className="border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-[10px] text-destructive">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="border-t bg-white px-3 py-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="space-y-2"
          >
            <div className="rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={chatHasVideoContext ? "Ask about the videos..." : "Ask a question..."}
                rows={2}
                className="min-h-[40px] border-none bg-transparent px-0 py-0 text-xs leading-normal shadow-none focus-visible:ring-0"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Enter to send</span>
              <Button
                type="submit"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
