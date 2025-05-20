import React, { useState, useRef, Dispatch, SetStateAction } from "react";
import { Box, Typography, TextField, Button, Alert, CircularProgress } from "@mui/material";
import "./MonetizationPlannerPage.css";
import { useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInterface from './ChatInterface';
import { getApiUrl } from '../config';

type Message = { role: 'user' | 'assistant' | 'system', content: string };

const SearchIntentToolPage: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const theme = useTheme();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const handleGenerate = async () => {
    setAnalysis("");
    setError(null);
    setLoading(true);
    abortController.current = new AbortController();
    let generatedAnalysis = "";
    try {
      const prompt = `Role: You are an advanced AI Search Intent Analyzer, specializing in SEO and content strategy.\nTask: Analyze the search intent behind the given keyword or topic: '${keyword}'.\n\nInstructions:\n- Identify the primary intent (informational, navigational, transactional, or commercial investigation)\n- Craft an enticing H1 search intent title that includes the target keyword plus relevant trigger words. Ensure the title is between 55 and 60 characters.\n- Analyze and present the following aspects in a table format: Content Type & Format, User's Main Goal, Key Expectations, What to Avoid, Important Elements to Include, Tone and Style, Call-to-Action, Additional Insights, Key Audience Segments (for transactional/commercial intent topics)\n- For any aspect with multiple details, each detail should be in its own cell with the corresponding column on the left blank after the first mention.\n- For transactional or commercial intent topics, include a comprehensive list of key audience segments.\n- Keep the analysis concise yet comprehensive, focusing on actionable insights.\n\nContext: In today's SEO landscape, understanding search intent is crucial for creating content that ranks well and satisfies user needs. Search engines prioritize content that best matches user intent, not just keyword density. Your analysis will help content creators avoid outdated SEO tactics and focus on producing highly relevant, user-centric content that addresses the core needs behind each search query.\n\nTo begin, analyze the search intent for: '${keyword}'. Present your analysis in a clean, easy-to-read table format as described.`;
      const response = await fetch(getApiUrl("/api/search-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword, 
          prompt,
          model: "phi4:latest"
        }),
        signal: abortController.current.signal,
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnalysis = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sseLines = buffer.split("\n\n");
        buffer = sseLines.pop() || "";
        for (const sse of sseLines) {
          if (sse.startsWith("data: ")) {
            try {
              const jsonStr = sse.replace(/^data: /, "");
              const data = JSON.parse(jsonStr);
              if (typeof data.intent === "string") {
                fullAnalysis += data.intent;
                setAnalysis(fullAnalysis);
                generatedAnalysis = fullAnalysis;
              }
            } catch (e) {}
          }
        }
      }
      if (generatedAnalysis) {
        setChatMessages([
          {
            role: 'assistant',
            content: `Context: The user asked for a search intent analysis for the keyword or topic "${keyword}". Here is the analysis:\n\n${generatedAnalysis}\n\nWhen the user asks follow-up questions, use this context to tailor your response.`
          }
        ]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    abortController.current?.abort();
    setLoading(false);
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
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.92)' : 'rgba(255,255,255,0.85)' }}>
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 6, p: 2, position: "relative", minHeight: 400 }}>
          <Typography variant="h5" gutterBottom>
            Please provide the keyword or topic you'd like me to analyze for search intent
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            (e.g., "best running shoes for flat feet," "how to grow tomatoes," or "buy organic protein powder")
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Once you share the query, I'll deliver a structured intent analysis table with actionable insights for content optimization.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>Example Output Format:</Typography>
          <Box sx={{ overflowX: 'auto', mb: 3 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: theme.palette.mode === 'dark' ? '#232936' : '#f9f9f9', color: theme.palette.mode === 'dark' ? '#f5f5f5' : '#232936', fontSize: 15 }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: 6, background: theme.palette.mode === 'dark' ? '#232936' : '#e3eafc', color: theme.palette.mode === 'dark' ? '#fff' : '#232936' }}>Aspect</th>
                  <th style={{ border: '1px solid #ccc', padding: 6, background: theme.palette.mode === 'dark' ? '#232936' : '#e3eafc', color: theme.palette.mode === 'dark' ? '#fff' : '#232936' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Primary Intent</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Informational/Transactional/etc.</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>H1 Search Intent Title</td><td style={{ border: '1px solid #ccc', padding: 6 }}>&quot;Best Running Shoes for Flat Feet: Top Picks &amp; Expert Tips (2024)&quot;</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Content Type &amp; Format</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Comparison guide with pros/cons, expert reviews, and buyer's checklist<br/>Video embedded (try-on tests, comfort analysis)</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>User's Main Goal</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Find supportive running shoes for flat arches</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Key Expectations</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Shoe recommendations with arch support<br/>Price ranges and durability comparisons</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>What to Avoid</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Overly promotional language without evidence</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Important Elements</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Podiatrist quotes, sizing tips, return policies</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Tone and Style</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Authoritative yet approachable; data-driven</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Call-to-Action</td><td style={{ border: '1px solid #ccc', padding: 6 }}>&quot;Compare prices on trusted retailers&quot;</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: 6 }}>Key Audience Segments</td><td style={{ border: '1px solid #ccc', padding: 6 }}>Runners with flat feet seeking budget options<br/>Marathon trainers needing premium support</td></tr>
              </tbody>
            </table>
            <Typography variant="body2" sx={{ mt: 1, color: theme.palette.mode === 'dark' ? '#f5f5f5' : '#888', fontStyle: 'italic' }}>
              Ready when you are—drop your keyword! 🔍
            </Typography>
          </Box>
          {loading && (
            <Box className="centered-logo-overlay">
              <img
                src="/images/blog/logo.png"
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
          <TextField
            label="Keyword or Topic to Analyze"
            placeholder="e.g., best running shoes for flat feet"
            variant="outlined"
            fullWidth
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            sx={{ my: 2 }}
            disabled={loading}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={!keyword.trim() || loading}
            >
              Analyze Intent
            </Button>
            {loading && (
              <Button variant="outlined" color="secondary" onClick={handleStop}>
                Stop
              </Button>
            )}
          </Box>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2, visibility: "hidden" }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2">Analyzing intent...</Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
          {analysis && (
            <Box sx={{ mt: 4, mb: 2, px: { xs: 0, sm: 2 } }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Search Intent Analysis
              </Typography>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis.replace(/<br\s*\/?>(\s*)/gi, '  \n')}
              </ReactMarkdown>
            </Box>
          )}
          {analysis && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Have follow-up questions or want to go deeper? Chat below:
              </Typography>
              <ChatInterface
                messages={getVisibleChatMessages(chatMessages)}
                onMessagesChange={setChatMessages}
                model="auto"
                onModelChange={() => {}}
              />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default SearchIntentToolPage; 