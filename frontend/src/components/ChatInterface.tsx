import { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  TextField, 
  IconButton,
  Typography,
  Avatar,
  Collapse
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import StopIcon from '@mui/icons-material/Stop'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { getApiUrl, API_CONFIG } from '../config'
import { useTheme } from '@mui/material/styles'
import ModelSelector from './ModelSelector'
import DataIngestion from './DataIngestion'
import SearchIcon from '@mui/icons-material/Search'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import md5 from 'blueimp-md5'
import type { Message } from '../types'

console.log('API Base URL:', API_CONFIG.BASE_URL);

interface ChatInterfaceProps {
  onMessagesChange: (messages: Message[]) => void;
  onTitleChange?: (title: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

interface ChatPayload {
  model: string;
  messages: Message[];
  image?: string;
}

interface IngestedData {
  title: string;
  content: string;
  source: string;
}

const MAX_INPUT_LENGTH = 8000;
const CUSTOM_INSTRUCTIONS_KEY = 'deepthinkai_custom_instructions';
const CUSTOM_INSTRUCTIONS_TOGGLE_KEY = 'deepthinkai_custom_instructions_enabled';
const RAG_BACKEND_URL = 'http://localhost:8001';

function stripThinkBlocks(text: string) {
  // Remove all <think>...</think> blocks
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// Utility to mask model names in assistant output
function maskModelNames(text: string): string {
  const modelNames = [
    'mistral', 'mistral:latest',
    'gemma3', 'gemma3:latest', 'gemma:7b',
    'deepseek', 'deepseek-r1', 'deepseek-r1:latest',
    'ollama', 'llama', 'llama2', 'llama-2', 'llama-3',
    'gpt', 'gpt-3', 'gpt-4', 'gpt4', 'gpt3',
    'phi4', 'phi4:latest',
    'llava', 'llava:latest',
    'llama2-uncensored', 'llama2-uncensored:latest',
    'codellama', 'codellama:latest',
    'llama3.2-vision', 'llama3.2-vision:latest',
    'minigpt4', 'minigpt4:latest',
  ];
  let masked = text;
  modelNames.forEach(name => {
    masked = masked.replace(new RegExp(`\\b${name}\\b`, 'gi'), 'Deepthink AI');
  });
  return masked;
}

// Utility to clean MiniGPT-4/vision model responses
function cleanMiniGptResponse(content: string): string {
  // Remove "describe this image <Img>...</Img>" and similar leading blocks
  // This regex removes from "describe this image" up to the closing </Img> (case-insensitive, non-greedy)
  return content.replace(/describe this image\s*<img>[\s\S]*?<\/img>/i, '').trim();
}

function gravatarUrl(email: string, size = 64) {
  const hash = email ? md5(email.trim().toLowerCase()) : '';
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

function ChatInterface({ onMessagesChange, onTitleChange, model, onModelChange, onLoadingChange }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [canResume, setCanResume] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();
  const [showDataIngestion, setShowDataIngestion] = useState(false);
  const [ingestedData, setIngestedData] = useState<IngestedData | null>(null);
  const [fileIngestStatus, setFileIngestStatus] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<{ [id: string]: Message[] }>({});
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => uuidv4());
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Focus input field when component mounts or messages change
    inputRef.current?.focus();
    if (onLoadingChange) onLoadingChange(isLoading);
  }, [messages, isLoading, input]);

  useEffect(() => {
    console.log('ChatInterface messages prop:', messages);
  }, [messages]);

  // Handle image or file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'txt' || ext === 'md') {
      // Ingest text/markdown file to RAG backend using FormData
      setFileIngestStatus(null);
      const formData = new FormData();
      formData.append('file', file);
      fetch(`${RAG_BACKEND_URL}/ingest`, {
        method: 'POST',
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to ingest file');
          setFileIngestStatus('File ingested into knowledge base!');
        })
        .catch(() => {
          setFileIngestStatus('Failed to ingest file.');
        });
      return;
    }
    // Otherwise, treat as image
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setAttachedImage(imageData);
      // Auto-select MiniGPT-4 when an image is attached
      if (model !== 'minigpt4:latest') {
        onModelChange('minigpt4:latest');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent, customMessages?: Message[]) => {
    e.preventDefault()
    if (!input.trim() && !customMessages && isLoading) return
    if (input.length > MAX_INPUT_LENGTH) return; // Prevent submission if too long

    let newMessages: Message[];
    if (customMessages) {
      newMessages = customMessages;
    } else {
      const userMessage: Message = { role: 'user', content: input };
      newMessages = [...messages, userMessage];
      setInput('');
    }
    // Inject custom instructions as system message only at the start of a new chat
    let shouldInjectInstructions = false;
    try {
      const enabled = localStorage.getItem(CUSTOM_INSTRUCTIONS_TOGGLE_KEY);
      shouldInjectInstructions = enabled === null || enabled === 'true';
    } catch {}
    if (shouldInjectInstructions && newMessages.length === 1) {
      try {
        const saved = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
        if (saved) {
          const customInstructions = JSON.parse(saved);
          if (customInstructions && (customInstructions.about || customInstructions.style)) {
            const systemContent = [customInstructions.about, customInstructions.style].filter(Boolean).join('\n\n').trim();
            if (systemContent) {
              newMessages = [
                { role: 'system', content: systemContent },
                ...newMessages
              ];
            }
          }
        }
      } catch {}
    }

    // --- RAG: Retrieve context and prepend to prompt ---
    let ragContext = '';
    if (
      input && input.trim().length > 0 &&
      model !== 'minigpt4:latest' &&
      model !== 'llava:latest'
    ) {
      try {
        const ragRes = await fetch(`${RAG_BACKEND_URL}/search?q=${encodeURIComponent(input)}`);
        if (ragRes.ok) {
          const ragData = await ragRes.json();
          if (ragData.documents && ragData.documents.length > 0) {
            ragContext = ragData.documents.map((doc: string, i: number) => {
              const meta = ragData.metadatas[i];
              return `Source: ${meta.title}\n${doc}`;
            }).join('\n\n');
          }
        }
      } catch (err) {
        // If RAG fails, continue without context
        console.warn('RAG context fetch failed:', err);
      }
    }
    if (ragContext) {
      // Prepend as a system message
      newMessages = [
        { role: 'system', content: `Use the following context to answer the question.\n${ragContext}` },
        ...newMessages
      ];
    }
    // --- END RAG ---

    setMessages([...messages, ...newMessages]);
    onMessagesChange([...messages, ...newMessages]);
    setIsLoading(true);
    // Optionally update chat title based on first user message
    if (onTitleChange && newMessages.length === 1) {
      onTitleChange(input.slice(0, 40) + (input.length > 40 ? '...' : ''))
    }

    // If model is 'auto' and prompt is very long, auto-select 'mistral:latest' for best results
    let usedModel = model;
    if (input.length > 1500 && model === 'auto') {
      usedModel = 'mistral:latest';
      onModelChange('mistral:latest');
    }

    // Prepare payload
    const payload: ChatPayload & { customInstructions?: any } = {
      model: usedModel,
      messages: [
        ...newMessages.filter(m => m.content && m.content.trim().length > 0)
      ]
    };
    if (attachedImage) {
      payload.image = attachedImage;
    }
    // If custom instructions are present and enabled, auto-select llama3.1:latest unless user has chosen a different model
    if (shouldInjectInstructions) {
      try {
        const saved = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
        if (saved) {
          const customInstructions = JSON.parse(saved);
          if (customInstructions && (customInstructions.about || customInstructions.style)) {
            payload.customInstructions = customInstructions;
            if (usedModel === 'auto') {
              usedModel = 'llama3.1:latest';
              payload.model = usedModel;
              onModelChange && onModelChange('llama3.1:latest');
            }
          }
        }
      } catch {}
    }

    // If using MiniGPT-4 and an image is attached, use the new endpoint
    if (model === 'minigpt4:latest' && attachedImage) {
      try {
        setIsLoading(true);
        const lastUserMessage = newMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || input;
        const response = await fetch(getApiUrl('/api/minigpt4-chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: lastUserMessage, image: attachedImage }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(errorData.detail || `Network response was not ok (${response.status})`);
        }
        const data = await response.json();
        let content = '';
        if (Array.isArray(data.response)) {
          content = data.response.map((item: any) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) return JSON.stringify(item);
            return String(item);
          }).join('\n');
        } else if (typeof data.response === 'object' && data.response !== null) {
          content = JSON.stringify(data.response, null, 2);
        } else {
          content = data.response?.toString() || '';
        }
        // Clean MiniGPT-4 response
        const cleanedContent = cleanMiniGptResponse(content);
        const assistantMessage: Message = { role: 'assistant', content: cleanedContent };
        setMessages([...messages, assistantMessage]);
        onMessagesChange([...messages, assistantMessage]);
        setCanResume(true);
      } catch (error) {
        console.error('Error in MiniGPT-4 image chat:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Sorry, there was an error processing your request.'
        };
        setMessages([...messages, ...(customMessages || []), errorMessage]);
        onMessagesChange([...messages, ...(customMessages || []), errorMessage]);
        setCanResume(true);
      } finally {
        setIsLoading(false);
        setCurrentRequestId(null);
        if (attachedImage) setAttachedImage(null);
      }
      return;
    }

    try {
      console.log('Sending chat request with payload:', payload);
      console.log('API URL:', getApiUrl('/api/chat'));
      
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Add this to handle cookies if needed
      });
      
      const requestId = response.headers.get('X-Request-ID');
      console.log('Received response with request ID:', requestId);
      setCurrentRequestId(requestId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.detail || `Network response was not ok (${response.status})`);
      }

      if (!response.body) {
        console.error('Response body is null');
        throw new Error('Response body is null');
      }

      console.log('Starting to read response stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add assistant message placeholder
      let assistantContent = '';
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            console.log('Stream reading complete');
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Split by double newlines (SSE message boundary)
          const messagesArr = buffer.split('\n\n');
          buffer = messagesArr.pop() || '';

          for (const message of messagesArr) {
            if (message.startsWith('data: ')) {
              const jsonStr = message.replace('data: ', '');
              try {
                const data = JSON.parse(jsonStr);
                console.log('Parsed data:', data);
                if (data.error) {
                  console.error('Received error:', data.error);
                  throw new Error(data.error);
                }
                if (data.message && data.message.content) {
                  assistantContent += data.message.content;
                }
                // If done, break out of the loop
                if (data.done) {
                  break;
                }
              } catch (err) {
                // If JSON.parse fails, skip this chunk and wait for the next one
                console.warn('Skipping incomplete JSON chunk:', jsonStr);
                continue;
              }
            }
          }
        }
        // After stream ends, add the full assistant message at once
        const lastMessages: Message[] = [...newMessages, { role: 'assistant', content: assistantContent }];
        setMessages([...messages, ...lastMessages]);
        onMessagesChange([...messages, ...lastMessages]);
      } catch (err) {
        console.error('Error processing stream:', err);
        if (err instanceof Error) {
          throw err;
        }
      }
      console.log('Stream processing complete');
      setCanResume(true);
    } catch (error) {
      console.error('Error in chat request:', error)
      const errorMessage: Message = { 
        role: 'assistant', 
        content: error instanceof Error ? error.message : 'Sorry, there was an error processing your request.' 
      }
      setMessages([...messages, ...(customMessages || []), errorMessage]);
      onMessagesChange([...messages, ...(customMessages || []), errorMessage]);
      setCanResume(true);
    } finally {
      console.log('Cleaning up request');
      setIsLoading(false)
      setCurrentRequestId(null);
      // Only clear the image if it was sent in this request
      if (attachedImage) setAttachedImage(null);
    }
  }

  const handleStop = async () => {
    if (!currentRequestId) return;
    try {
      await fetch(getApiUrl(`/api/chat/stop/${currentRequestId}`), { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setIsLoading(false);
    setCurrentRequestId(null);
    setCanResume(true);
  };

  const handleResume = () => {
    // Add a user message 'Please continue' and resend the full conversation history
    const resumeMessages = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as 'user', content: 'Please continue' }
    ];
    setCanResume(false);
    // Create a synthetic FormEvent to satisfy the type
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent, resumeMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        (e.target as HTMLInputElement).form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  // Auto-select vision model if image is attached
  useEffect(() => {
    if (attachedImage) {
      if (model !== 'minigpt4:latest' && model !== 'llava:latest') {
        onModelChange('minigpt4:latest');
      }
    }
  }, [attachedImage, model, onModelChange]);

  // Ensure model selector is set to llama3.1:latest when custom instructions are active and enabled
  useEffect(() => {
    try {
      const enabled = localStorage.getItem(CUSTOM_INSTRUCTIONS_TOGGLE_KEY);
      const shouldInjectInstructions = enabled === null || enabled === 'true';
      if (shouldInjectInstructions) {
        const saved = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
        if (saved) {
          const customInstructions = JSON.parse(saved);
          if (customInstructions && (customInstructions.about || customInstructions.style)) {
            if (model !== 'llama3.1:latest') {
              onModelChange('llama3.1:latest');
            }
          }
        }
      }
    } catch {}
  }, [model]);

  const handleDataIngested = (data: IngestedData) => {
    setIngestedData(data);
    // Add the ingested data as a system message
    const systemMessage: Message = {
      role: 'system',
      content: `Here is information from ${data.source} about "${data.title}":\n\n${data.content}\n\nPlease use this information to provide more accurate and detailed responses.`
    };
    setMessages([...messages, systemMessage]);
    onMessagesChange([...messages, systemMessage]);
  };

  // When switching conversations, save current and load new
  const switchConversation = (conversationId: string) => {
    setChatHistories(prev => ({ ...prev, [currentConversationId]: messages }));
    setMessages(chatHistories[conversationId] || []);
    setCurrentConversationId(conversationId);
    setAttachedImage(null);
    setInput('');
  };

  // When starting a new chat
  const startNewChat = () => {
    const newId = uuidv4();
    setChatHistories(prev => ({ ...prev, [currentConversationId]: messages }));
    setMessages([]);
    setCurrentConversationId(newId);
    setAttachedImage(null);
    setInput('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {isLoading && (
        <Box className="centered-logo-overlay" sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          background: theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.7)' : 'rgba(255,255,255,0.7)'
        }}>
          <img
            src="/brand/logo.png"
            alt="Deepthink AI Logo"
            className="pulsate-logo"
            style={{ width: 120, height: 120 }}
          />
          <Typography className="pulsate-thinking" variant="h6" sx={{ mt: 2 }}>
            Thinking
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#888', fontStyle: 'italic' }}>
            Response can take 2-5 minutes
          </Typography>
        </Box>
      )}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        pt: { xs: '100px', sm: '100px' },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'transparent',
        background: 'linear-gradient(to bottom, #2196f3 0%, #ffffff 100%)',
      }}>
        <Collapse in={showDataIngestion}>
          <DataIngestion onDataIngested={handleDataIngested} />
        </Collapse>
        
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: { xs: '95%', sm: '70%' },
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                bgcolor: msg.role === 'user' ? 'primary.main' : msg.role === 'system' ? 'info.main' : undefined,
                width: 32,
                height: 32,
                ...(msg.role === 'assistant' && {
                  background: 'linear-gradient(135deg, #ff9800 0%, #ff6b00 100%)',
                  color: '#fff',
                  border: '2px solid #fff',
                })
              }}
              src={
                msg.role === 'user'
                  ? (user?.photoURL || (user?.email ? gravatarUrl(user.email) : undefined))
                  : msg.role === 'assistant'
                    ? '/brand/logo.png'
                    : undefined
              }
              alt={msg.role === 'user' ? (user?.displayName || user?.email || 'User') : 'AI'}
            >
              {msg.role === 'user'
                ? (user?.displayName ? user.displayName[0] : 'U')
                : msg.role === 'system'
                  ? <InfoOutlinedIcon fontSize="small" />
                  : null}
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: msg.role === 'system' ? '#e3f2fd' : 'white',
                color: theme.palette.mode === 'dark' ? '#111' : (msg.role === 'user' ? '#ff6b00' : 'text.primary'),
                border: msg.role === 'system' ? '2px dashed #2196f3' : msg.role === 'user' ? '2px solid #ff6b00' : '1px solid #e3eafc',
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(255,107,0,0.08)' : '0 2px 8px rgba(33,150,243,0.08)',
                borderRadius: 3,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  [msg.role === 'user' ? 'right' : 'left']: -8,
                  width: 16,
                  height: 16,
                  bgcolor: msg.role === 'system' ? '#e3f2fd' : 'white',
                  border: msg.role === 'system' ? '2px dashed #2196f3' : msg.role === 'user' ? '2px solid #ff6b00' : '1px solid #e3eafc',
                  transform: 'rotate(45deg)',
                  zIndex: 0
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, color: theme.palette.mode === 'dark' ? '#111' : undefined }}>
                <ReactMarkdown
                  components={{
                    code: (props: any) => {
                      const {inline, className, children, ...rest} = props;
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...rest}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.role === 'assistant' ? maskModelNames(stripThinkBlocks(msg.content)) : msg.content}
                </ReactMarkdown>
              </Box>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          boxShadow: '0 -2px 8px rgba(33,150,243,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <ModelSelector model={model} onModelChange={onModelChange} />
          <IconButton
            onClick={() => setShowDataIngestion(!showDataIngestion)}
            title={showDataIngestion ? "Hide Knowledge Base Search" : "Show Knowledge Base Search"}
          >
            <SearchIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          {/* Image preview */}
          {attachedImage && (
            <Box sx={{ mr: 1, mb: 0.5, position: 'relative', display: 'inline-block' }}>
              <img src={attachedImage} alt="attachment" style={{ maxHeight: 48, borderRadius: 6 }} />
              <IconButton
                aria-label="Remove image"
                title="Remove image"
                size="small"
                onClick={() => setAttachedImage(null)}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  zIndex: 2
                }}
              >
                ×
              </IconButton>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            maxRows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            variant="outlined"
            size="small"
            inputRef={inputRef}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : undefined,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? '#232936' : 'background.default',
                color: theme.palette.mode === 'dark' ? '#fff' : undefined,
                '& input, & textarea': {
                  color: theme.palette.mode === 'dark' ? '#fff' : undefined,
                  '::placeholder': {
                    color: theme.palette.mode === 'dark' ? '#bbb' : undefined,
                    opacity: 1
                  }
                }
              }
            }}
            error={input.length > MAX_INPUT_LENGTH}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography variant="caption" color={input.length > MAX_INPUT_LENGTH ? 'error' : 'text.secondary'}>
              {input.length} / {MAX_INPUT_LENGTH} characters
            </Typography>
          </Box>
          {/* Image attachment button */}
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleImageChange}
            title="Upload image"
          />
          <label htmlFor="image-upload">
            <IconButton aria-label="Attach file" component="span" sx={{ mb: 0.5 }}>
              <AttachFileIcon />
            </IconButton>
          </label>
          {isLoading ? (
            <IconButton 
              color="error" 
              onClick={handleStop}
              sx={{ 
                height: 40, 
                width: 40,
                bgcolor: 'error.light',
                color: 'error.contrastText',
                '&:hover': {
                  bgcolor: 'error.main'
                }
              }}
              aria-label="Stop generation"
              title="Stop generation"
            >
              <StopIcon />
            </IconButton>
          ) : canResume ? (
            <IconButton 
              color="primary" 
              onClick={handleResume}
              sx={{ 
                height: 40, 
                width: 40,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.main'
                }
              }}
              aria-label="Resume generation"
              title="Resume generation"
            >
              <PlayArrowIcon />
            </IconButton>
          ) : (
            <IconButton 
              type="submit"
              color="primary"
              disabled={!input.trim()}
              sx={{ 
                height: 40, 
                width: 40,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
              aria-label="Send message"
              title="Send message"
            >
              <SendIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      {fileIngestStatus && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color={fileIngestStatus.includes('Failed') ? 'error' : 'success.main'}>
            {fileIngestStatus}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ChatInterface
