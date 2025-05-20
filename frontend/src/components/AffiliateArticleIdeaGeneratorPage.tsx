import React, { useState, useRef } from "react";
import { Box, Typography, TextField, Button, Paper, Alert, Switch, FormControlLabel, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { getApiUrl } from '../config';
import { Helmet } from 'react-helmet-async';

const SUBTITLE = "Generate high-converting affiliate article ideas with SEO & clickbait options. Just enter your niche, keyword, or domain.";

const ONBOARDING_MESSAGE = `Enter a sub-niche, keyword, or domain (e.g., "Home Fitness Equipment", "Organic Skincare", "microsoft.com").\n\nI'll generate:\n- 20 high-converting transactional affiliate article ideas\n- Low-competition long-tail keywords (3-5 words)\n- Prioritization tips based on SEO value and buyer intent`;

function isDomain(input: string) {
  // Simple domain regex
  return /^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(input.trim());
}

const AffiliateArticleIdeaGeneratorPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seoClickbait, setSeoClickbait] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const theme = useTheme();

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setAiResponse(null);
    abortController.current = new AbortController();
    try {
      let endpoint = "/api/affiliate-article-ideas";
      let body: any = {};
      if (isDomain(input)) {
        endpoint = "/api/affiliate-article-ideas-by-domain";
        body = { domain: input.trim() };
      } else {
        body = {
          prompt: `${ONBOARDING_MESSAGE}\n\nSEO & Clickbait: ${seoClickbait ? 'Enabled' : 'Disabled'}`,
          sub_niche: input.trim(),
        };
      }
      const response = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortController.current.signal,
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      setAiResponse(data.content || data.raw || "");
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Extract ideas as array for card display
  function extractIdeas(text: string): string[] {
    // Try to split by numbered list or bullet points
    const lines = text.split(/\n+/).filter(l => l.trim());
    const ideas = lines.filter(l => /^\d+\./.test(l) || /^[-*]/.test(l));
    if (ideas.length > 0) return ideas.map(l => l.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''));
    // Fallback: split by newlines
    return lines;
  }

  const handleCopy = (idea: string, idx: number) => {
    navigator.clipboard.writeText(idea);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <>
      <Helmet>
        <title>Affiliate Article Idea Generator | DeepThink AI</title>
        <meta name="description" content="Generate high-converting affiliate article ideas with DeepThink AI's Affiliate Article Idea Generator. Get low-competition long-tail keywords and prioritization tips." />
        <link rel="canonical" href="https://www.deepthinkai.app/affiliate-article-idea-generator" />
        <meta property="og:title" content="Affiliate Article Idea Generator | DeepThink AI" />
        <meta property="og:description" content="Generate high-converting affiliate article ideas with DeepThink AI's Affiliate Article Idea Generator. Get low-competition long-tail keywords and prioritization tips." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.deepthinkai.app/affiliate-article-idea-generator" />
        <meta property="og:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Affiliate Article Idea Generator | DeepThink AI" />
        <meta name="twitter:description" content="Generate high-converting affiliate article ideas with DeepThink AI's Affiliate Article Idea Generator. Get low-competition long-tail keywords and prioritization tips." />
        <meta name="twitter:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:url" content="https://www.deepthinkai.app/affiliate-article-idea-generator" />
      </Helmet>
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, background: theme.palette.mode === 'dark' ? '#232936' : '#f5f7fa' }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: 'transparent' }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', pt: 8, pb: 2, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: 32, sm: 48 } }}>
            Article Idea Generator
          </Typography>
          <Typography variant="h5" sx={{ color: 'text.secondary', mb: 3, fontWeight: 400 }}>
            {SUBTITLE}
          </Typography>
          <FormControlLabel
            control={<Switch checked={seoClickbait} onChange={e => setSeoClickbait(e.target.checked)} color="primary" />}
            label={<span style={{ fontWeight: 500 }}>Enable SEO & Clickbait Feature</span>}
            sx={{ mb: 2, mx: 'auto', display: 'block' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
            <TextField
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter sub-niche, keyword, or domain (e.g., smart home, yelp.com)"
              variant="outlined"
              sx={{ flex: 1, minWidth: 240, bgcolor: '#fff', borderRadius: 2 }}
              disabled={loading}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) handleSubmit(); }}
              size="medium"
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, fontWeight: 700, fontSize: 20, borderRadius: 2, bgcolor: '#6c47ff', '&:hover': { bgcolor: '#4b2fcf' } }}
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
            >
              {loading ? 'Generating...' : <>&rarr;</>}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Click on any idea to copy it to your clipboard.
          </Typography>
        </Box>
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 2, p: 2, minHeight: 300 }}>
          {loading && (
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
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
          {aiResponse && (
            <Box sx={{ mt: 2 }}>
              {extractIdeas(aiResponse).map((idea, idx) => (
                <Paper
                  key={idx}
                  elevation={2}
                  sx={{
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, background 0.2s',
                    boxShadow: copiedIdx === idx ? '0 0 0 2px #6c47ff' : '0 2px 8px #0001',
                    background: copiedIdx === idx ? '#f3f0ff' : '#fff',
                    '&:hover': { boxShadow: '0 0 0 2px #6c47ff', background: '#f3f0ff' },
                  }}
                  onClick={() => handleCopy(idea, idx)}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 18, flex: 1, textAlign: 'left' }}>{idea}</Typography>
                  <Tooltip title={copiedIdx === idx ? 'Copied!' : 'Copy'}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <ContentCopyIcon color={copiedIdx === idx ? 'primary' : 'action'} />
                    </IconButton>
                  </Tooltip>
                </Paper>
              ))}
              {/* Show full markdown below if not a list */}
              {extractIdeas(aiResponse).length < 2 && (
                <Paper sx={{ p: 2, mt: 2, background: '#fff' }}>
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
                    {aiResponse}
                  </ReactMarkdown>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default AffiliateArticleIdeaGeneratorPage; 