import { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  TextField, 
  IconButton,
  Typography,
  Avatar
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import StopIcon from '@mui/icons-material/Stop'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { getApiUrl, API_CONFIG } from '../config'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

console.log('API Base URL:', API_CONFIG.BASE_URL);

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  onTitleChange?: (title: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

const MIN_MODEL_SWITCH_INTERVAL = 3000; // 3 seconds
const MAX_INPUT_LENGTH = 8000;

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
  ];
  let masked = text;
  modelNames.forEach(name => {
    masked = masked.replace(new RegExp(`\\b${name}\\b`, 'gi'), 'Deepthink AI');
  });
  return masked;
}

function ChatInterface({ messages, onMessagesChange, onTitleChange, model, onModelChange, onLoadingChange }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [canResume, setCanResume] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [lastModelSwitch, setLastModelSwitch] = useState(Date.now());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Focus input field when component mounts or messages change
    inputRef.current?.focus();
    if (onLoadingChange) onLoadingChange(isLoading);
  }, [messages, isLoading, input]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      onMessagesChange(newMessages);
      setInput('');
    }
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
    const payload: any = {
      model: usedModel,
      messages: [
        ...newMessages
      ]
    };
    if (attachedImage) {
      payload.image = attachedImage;
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
      let lastMessages: Message[] = [...newMessages, { role: 'assistant', content: '' }];
      onMessagesChange(lastMessages);
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
                if (data.done) {
                  console.log('Received done signal');
                  return;
                }
                if (data.message && data.message.content) {
                  assistantContent += data.message.content;
                  // Update the last assistant message in the local array
                  lastMessages[lastMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  };
                  onMessagesChange([...lastMessages]);
                }
              } catch (err) {
                // If JSON.parse fails, skip this chunk and wait for the next one
                console.warn('Skipping incomplete JSON chunk:', jsonStr);
                continue;
              }
            }
          }
        }
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
      onMessagesChange([...messages, ...(customMessages || []), errorMessage] as Message[])
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
    if (attachedImage && model !== 'llava:latest') {
      onModelChange('llava:latest');
    }
  }, [messages, isLoading, input, attachedImage]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'transparent',
        background: 'linear-gradient(to bottom, #2196f3 0%, #ffffff 100%)',
      }}>
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
                bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                width: 32,
                height: 32,
              }}
            >
              {msg.role === 'user' ? 'U' : 'AI'}
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: 'white',
                color: msg.role === 'user' ? '#ff6b00' : 'text.primary',
                border: msg.role === 'user' ? '2px solid #ff6b00' : '1px solid #e3eafc',
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
                  bgcolor: 'white',
                  border: msg.role === 'user' ? '2px solid #ff6b00' : '1px solid #e3eafc',
                  transform: 'rotate(45deg)',
                  zIndex: 0
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
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
          gap: 1,
          alignItems: 'flex-end',
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          boxShadow: '0 -2px 8px rgba(33,150,243,0.08)'
        }}
      >
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
            color: (isMobile && theme.palette.mode === 'dark') ? '#fff' : undefined,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.default',
              color: (isMobile && theme.palette.mode === 'dark') ? '#fff' : undefined,
              '& input, & textarea': {
                color: (isMobile && theme.palette.mode === 'dark') ? '#fff' : undefined,
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
  )
}

export default ChatInterface
