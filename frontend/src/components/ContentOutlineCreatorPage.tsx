import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, Alert } from "@mui/material";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChatInterface from './ChatInterface';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant', content: string };

const SYSTEM_PROMPT = `Role: You are an experienced content strategist and SEO expert.
Task: Your task is to create an SEO-optimized content outline for a given target keyword or topic. The outline should include the following elements:
A title (H1) that incorporates the target keyword
A meta description that summarizes the content and includes the target keyword
An introduction that engages the reader and sets the context for the article
Main headings (H2s) that cover key subtopics and use semantic keywords
Bullet points under each H2 to provide a brief overview of the content to be covered
A conclusion that summarizes the main points and provides a call to action or final thoughts
A list of semantic keywords thematically related to the main keyword, providing around 50 keywords, with one keyword per line.
Context: The content outline is designed to help writers create high-quality, SEO-friendly articles that comprehensively cover a given topic. The outline should be structured in a way that makes it easy for writers to understand the main points to be covered and ensure that the content is well-organized and engaging for readers.
Process:
Ask the client to provide their target keyword or topic.
Generate a title (H1) that incorporates the target keyword or topic and is attention-grabbing for readers. If there is a year in the title, it is 2025.
Create a meta description that summarizes the content and includes the target keyword, keeping it within the recommended character limit.
Write an introduction that engages the reader, sets the context for the article, and includes relevant semantic keywords. Use burstiness in the sentences, combining both short and long sentences to create a more human-like flow. Use human writing like exclamation points and first person perspectives. The intro should include either an interesting stat, quotation, or something to hook the reader.
Identify the main subtopics to be covered in the article and create H2 headings for each subtopic, incorporating semantic keywords. Write in an authoritative but friendly tone.
Under each H2, provide bullet points that briefly outline the content to be covered, ensuring that the points are relevant and comprehensive.
Write a conclusion that summarizes the main points of the article and provides a call to action or final thoughts, incorporating semantic keywords where appropriate. Use burstiness in the sentences to maintain a natural, human-like flow.
Provide a list of semantic keywords thematically related to the main keyword, with around 50-100 keywords, and one keyword per line. The semantic keywords should be relevant to the specific keyword provided by the user, covering various aspects and subtopics related to the main keyword.
Tips:
Use tools like SurferSEO and Neuron Writer to identify semantic keywords related to the main topic.
Ensure that the outline is well-structured and easy to follow, with a logical flow between subtopics.
Keep the introduction and conclusion engaging and informative, as these sections play a crucial role in hooking readers and leaving a lasting impression.
Use action verbs and descriptive language in the title and H2s to make the content more compelling and engaging.
Optimize the meta description to ensure that it accurately summarizes the content and encourages readers to click through from search engine results pages.
Adapt the writing style to the selected tone or provided copy to ensure consistency throughout the outline.
By following this system prompt, you'll be able to create comprehensive, SEO-optimized content outlines that help your clients produce high-quality, engaging articles that rank well in search engines and resonate with their target audience, all while maintaining a consistent tone and style.`;

const ONBOARDING_MESSAGE = `# Step 1: Subniche Content Idea Generator\nWhat's your main niche? (e.g., fitness, personal finance, gardening, tech, parenting, etc.)\n\nOnce you provide that, I'll:\n\n- Generate 5 relevant sub-niches within your main niche.\n- For each sub-niche, create 5 SEO-friendly content topic ideas.\n- Present everything in a clean, organized format.\n\n# Step 2: Targeted Keyword Idea Generator\nAfter you pick a sub-niche, I'll generate:\n\n- 15 informational article ideas (easy to rank for)\n- 5 transactional/affiliate post ideas\n- 2 pillar posts (1 affiliate, 1 informational)\nAll with SEO-friendly titles & target keywords in a table.\n\n# Step 3: SEO-Optimized Content Outline Creator\nYou'll choose one keyword, and I'll create a full outline with:\n- ✔ Title (H1) – Optimized & engaging\n- ✔ Meta description – Click-worthy & keyword-rich\n- ✔ Introduction – Hook + context\n- ✔ H2s with bullet points – Logical flow, semantic keywords\n- ✔ Conclusion – Recap + call to action\n- ✔ 50-100 semantic keywords – For NLP & depth\n\n# Step 4: AI Content Machine (Paragraph Generator)\nFor each H2, I'll write 400+ words in a human-like, conversational tone with:\n- ✅ Personal anecdotes (made-up but realistic)\n- ✅ Practical tips (from "experience")\n- ✅ Semantic keywords (naturally placed)\n- ✅ Burstiness (short + long sentences)\n- ✅ Occasional slang/errors (for authenticity)\n- ✅ Featured snippet-ready (clear, helpful answers)\n\nLet's Get Started!\n\nWhat's your main niche? (e.g., "gardening," "personal finance," "tech gadgets")\n\nOnce you tell me, I'll generate sub-niches + content ideas immediately!\n\n*(Example: If you say "fitness," I might suggest sub-niches like "home workouts," "weight loss nutrition," "running for beginners," etc., each with 5 blog topic ideas.)*\n\nYour turn! 🚀`;

const ContentOutlineCreatorPage: React.FC = () => {
  const [mainNiche, setMainNiche] = useState("");
  const [subniches, setSubniches] = useState<any[] | null>(null);
  const [selectedSubniche, setSelectedSubniche] = useState<string | null>(null);
  const [keywordTable, setKeywordTable] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const askedForFullArticleRef = useRef(false);

  // Debug: log if outline is not a string
  useEffect(() => {
    if (keywordTable && typeof keywordTable !== 'string') {
      console.error('Keyword table is not a string:', keywordTable);
    }
  }, [keywordTable]);

  // Reset the flag if a new keyword is selected
  useEffect(() => {
    askedForFullArticleRef.current = false;
  }, [selectedKeyword]);

  useEffect(() => {
    // Only run if chatMessages has at least 2 messages and the last is from assistant
    if (
      keywordTable &&
      chatMessages.length > 0 &&
      chatMessages[chatMessages.length - 1].role === "assistant" &&
      !askedForFullArticleRef.current
    ) {
      // Heuristic: look for outline-like content in the last assistant message
      const lastContent = chatMessages[chatMessages.length - 1].content;
      if (
        /outline|h2|meta description|introduction|conclusion|semantic keywords/i.test(lastContent) &&
        !/Would you like me to generate the full humanized SEO-optimized article/i.test(lastContent)
      ) {
        setChatMessages([
          ...chatMessages,
          {
            role: "assistant",
            content:
              "Would you like me to generate the full humanized SEO-optimized article for this topic?",
          },
        ]);
        askedForFullArticleRef.current = true;
      }
    }
  }, [chatMessages, keywordTable]);

  // Step 1: Generate sub-niches and content ideas
  const handleStep1 = async () => {
    setError(null);
    setLoading(true);
    setAiResponse(null);
    setSubniches(null);
    abortController.current = new AbortController();
    try {
      const response = await fetch("/api/content-outline-subniches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ main_niche: mainNiche }),
        signal: abortController.current.signal,
      });
      if (!response.ok) throw new Error("Failed to get sub-niches");
      const data = await response.json();
      console.log('DEBUG: subniches response', data);
      let parsedSubniches = null;
      if (data.subniches) {
        if (Array.isArray(data.subniches)) {
          parsedSubniches = data.subniches;
        } else if (typeof data.subniches === 'string') {
          try {
            const arr = JSON.parse(data.subniches);
            if (Array.isArray(arr)) parsedSubniches = arr;
            else if (arr.subniches || arr.sub_niches) parsedSubniches = arr.subniches || arr.sub_niches;
          } catch {}
        } else if (data.subniches.sub_niches) {
          parsedSubniches = data.subniches.sub_niches;
        } else if (data.subniches.subniches) {
          parsedSubniches = data.subniches.subniches;
        } else {
          parsedSubniches = data.subniches;
        }
        if (Array.isArray(parsedSubniches)) {
          setSubniches(parsedSubniches);
        } else {
          setAiResponse(JSON.stringify(data.subniches, null, 2));
        }
      } else if (data.raw) {
        setAiResponse(data.raw);
      } else if (data.niche && data.subniches) {
        setSubniches(data.subniches);
      } else {
        setAiResponse(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate keyword/article ideas for a sub-niche
  const handleStep2 = async (subniche: string) => {
    setError(null);
    setLoading(true);
    setKeywordTable(null);
    setSelectedSubniche(subniche);
    abortController.current = new AbortController();
    try {
      const response = await fetch("/api/content-outline-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub_niche: subniche }),
        signal: abortController.current.signal,
      });
      if (!response.ok) throw new Error("Failed to get keyword ideas");
      const data = await response.json();
      if (data.table_markdown) {
        setKeywordTable(data.table_markdown);
        // Initialize chat with context after step 2
        setChatMessages([
          {
            role: 'assistant',
            content: `Context: The user is working on content planning for the main niche "${mainNiche}" and sub-niche "${subniche}". Here are the keyword and article ideas (table):\n\n${data.table_markdown}\n\nWhen the user asks for an outline, paragraphs, or follow-up, use this context to tailor your response.`
          },
          {
            role: 'assistant',
            content: "Which article would you like to work on next? Please copy-paste the title or keyword from the table above."
          }
        ]);
        // Auto-select first keyword and trigger step 3
        const keywords = extractKeywordsFromMarkdownTable(data.table_markdown);
        if (keywords.length > 0) {
          setSelectedKeyword(keywords[0]);
        }
      } else {
        setError("Unexpected response from server");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper to call handleStep3 with a specific keyword
  function extractKeywordsFromMarkdownTable(md: string): string[] {
    const lines = md.split("\n").filter(l => l.trim().length > 0);
    const tableLines = lines.filter(l => l.includes("|") && !/^\s*\|?\s*-+/.test(l));
    if (tableLines.length < 2) return [];
    // Remove header
    const dataLines = tableLines.slice(1);
    return dataLines.map(line => {
      const cells = line.split("|").map(c => c.trim());
      // Usually, the second or third column is the title/keyword
      return cells[2] || cells[1] || cells[0] || "";
    }).filter(Boolean);
  }

  // Helper: Fix Markdown table formatting
  function fixMarkdownTable(md: string): string {
    // Find all tables in the markdown and fix them
    return md.replace(
      // Match a table header and separator, followed by a long line of cells
      /(\|[^\n]+\|)\n(\|[-:| ]+\|)\n([^\n]+\|)+/g,
      (match) => {
        // If already has multiple lines after the separator, skip
        const lines = match.split('\n');
        if (lines.length > 3) return match;
        // Split header, separator, and data
        const [header, separator, ...rest] = lines;
        // Join the rest and split by '|', remove empty at start/end
        let cells = rest.join('').split('|').map(s => s.trim()).filter(Boolean);
        // Count columns from header
        const colCount = header.split('|').length - 2;
        let out = header + '\n' + separator + '\n';
        for (let i = 0; i < cells.length; i += colCount) {
          out += '| ' + cells.slice(i, i + colCount).join(' | ') + ' |\n';
        }
        return out;
      }
    );
  }

  // Step 3: Generate full content outline for a selected keyword
  const handleStep3 = async (keywordOverride?: string) => {
    setError(null);
    setLoading(true);
    abortController.current = new AbortController();
    try {
      const response = await fetch("/api/content-outline-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: SYSTEM_PROMPT,
          niche: keywordOverride || selectedKeyword,
        }),
        signal: abortController.current.signal,
      });
      if (!response.ok) throw new Error("Failed to get outline");
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                console.log('DEBUG: outline fullResponse', fullResponse);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper: filter out system/context messages from chat display
  function getVisibleChatMessages(messages: Message[]): Message[] {
    // Only show user and assistant messages after the user starts chatting
    if (messages.length > 1 && messages[0].role === 'assistant' && messages[0].content.startsWith('Context:')) {
      return messages.slice(1);
    }
    return messages;
  }

  return (
    <>
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundImage: 'url(/images/android-chrome-512x512.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: 0, background: 'rgba(255,255,255,0.85)' }}>
        {loading && (
          <Box className="centered-logo-overlay" sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            background: 'rgba(255,255,255,0.7)'
          }}>
            <img
              src="/images/android-chrome-512x512.png"
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
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 2, p: 1, position: "relative", minHeight: 0 }}>
          <Typography variant="h4" gutterBottom>
            Deepthink AI Content Creation Machine
          </Typography>
          <Paper elevation={3} sx={{ mt: 1, p: 1.5 }}>
            <ReactMarkdown>{ONBOARDING_MESSAGE}</ReactMarkdown>
          </Paper>
          <TextField
            label="What's your main niche? (e.g., fitness, personal finance, gardening, tech, parenting, etc.)"
            variant="outlined"
            fullWidth
            value={mainNiche}
            onChange={e => setMainNiche(e.target.value)}
            sx={{ my: 1.5 }}
            disabled={loading}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStep1}
              disabled={!mainNiche.trim() || loading}
            >
              Generate Sub-niches & Ideas
            </Button>
            {loading && (
              <Button variant="outlined" color="secondary" onClick={() => abortController.current?.abort()}>
                Stop
              </Button>
            )}
          </Box>
          {/* Step 1 Results */}
          {subniches && (
            <Paper elevation={3} sx={{ mt: 2, p: 1.5 }}>
              <Typography variant="h6">Sub-niches & Content Ideas</Typography>
              {Array.isArray(subniches) ? (
                <Box>
                  {subniches.map((item, idx) => {
                    // Support both item.ideas, item.content_topic_ideas, and item.content_topics, fallback to empty array
                    let ideas: string[] = [];
                    if (Array.isArray(item.ideas)) ideas = item.ideas;
                    else if (Array.isArray(item.content_topic_ideas)) ideas = item.content_topic_ideas;
                    else if (Array.isArray(item.content_topics)) ideas = item.content_topics;
                    else if (typeof item.ideas === 'string') ideas = (item.ideas as string).split(/\n|;|,|\|/).map((s: string) => s.trim()).filter(Boolean);
                    else if (typeof item.content_topic_ideas === 'string') ideas = (item.content_topic_ideas as string).split(/\n|;|,|\|/).map((s: string) => s.trim()).filter(Boolean);
                    else if (typeof item.content_topics === 'string') ideas = (item.content_topics as string).split(/\n|;|,|\|/).map((s: string) => s.trim()).filter(Boolean);

                    return (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{item.name || item.subniche || item.sub_niche || `Sub-niche ${idx + 1}`}</Typography>
                        {ideas.length > 0 && (
                          <ul>
                            {ideas.map((idea: string, i: number) => (
                              <li key={i}>{idea}</li>
                            ))}
                          </ul>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 0.5 }}
                          onClick={() => handleStep2(item.name || item.subniche || item.sub_niche)}
                          disabled={loading}
                        >
                          Next: Generate Keyword Ideas
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <pre>{JSON.stringify(subniches, null, 2)}</pre>
              )}
            </Paper>
          )}
          {/* Step 2 Results: Keyword Table */}
          {keywordTable && (
            <div style={{ margin: '32px 0 32px 0', padding: 0 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                Keyword & Article Ideas for: {selectedSubniche}
              </Typography>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => (
                    <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 16, fontSize: 15, background: 'white' }} {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th style={{ border: '1px solid #ccc', padding: 8, background: '#e3eafc', fontWeight: 700, textAlign: 'left' }} {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td style={{ border: '1px solid #ccc', padding: 8, verticalAlign: 'top' }} {...props} />
                  ),
                  h1: ({node, ...props}) => (
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: '24px 0 12px' }} {...props} />
                  ),
                  h2: ({node, ...props}) => (
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: '20px 0 10px' }} {...props} />
                  ),
                  h3: ({node, ...props}) => (
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px' }} {...props} />
                  ),
                  p: ({node, ...props}) => (
                    <p style={{ margin: '8px 0' }} {...props} />
                  ),
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
                      <code className={className} style={{ background: '#f4f4f4', borderRadius: 3, padding: '2px 5px' }} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {fixMarkdownTable(keywordTable)}
              </ReactMarkdown>
            </div>
          )}
          {keywordTable && (
            <Box sx={{ mt: 4 }}>
              <ChatInterface
                messages={getVisibleChatMessages(chatMessages)}
                onMessagesChange={setChatMessages}
                model="auto"
                onModelChange={() => {}}
              />
            </Box>
          )}
          {/* Fallback for raw AI response */}
          {aiResponse && (
            <Paper elevation={3} sx={{ mt: 2, p: 1.5 }}>
              <Typography variant="h6">AI Response</Typography>
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
            </Paper>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
        </Box>
      </Box>
    </>
  );
};

export default ContentOutlineCreatorPage; 