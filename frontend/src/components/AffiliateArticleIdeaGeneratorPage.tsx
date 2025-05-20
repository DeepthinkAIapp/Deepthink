import React, { useState, useRef } from "react";
import { Box, Typography, TextField, Button, Paper, Alert } from "@mui/material";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { getApiUrl } from '../config';
import { Helmet } from 'react-helmet-async';

const ONBOARDING_MESSAGE = `**Step 1: Enter Your Sub-Niche**

Please provide one sub-niche you'd like to focus on (e.g., "Home Fitness Equipment," "Organic Skincare for Acne," "Budget Travel Gear," etc.).

Once you share the sub-niche, I'll generate:
- ✅ 20 high-converting transactional affiliate article ideas
- ✅ Low-competition long-tail keywords (3-5 words)
- ✅ Prioritization tips based on SEO value and buyer intent

Let me know your sub-niche, and I'll create the full strategy for you!

*(Example: If you entered "Blenders for Smoothies," I'd generate titles like "Best High-Speed Blenders for Protein Shakes" targeting long-tail keywords like "best high-speed protein shake blender.")*

Your turn—what's your sub-niche? 🚀`;

// Helper: Fix Markdown table formatting
function fixMarkdownTable(md: string): string {
  // Find the first table header line
  const lines = md.split('\n');
  let inTable = false;
  let fixedLines: string[] = [];
  for (let line of lines) {
    // Detect table header
    if (line.trim().startsWith('|') && line.includes('|')) {
      inTable = true;
      // Split concatenated rows if needed
      if (line.includes('||')) {
        // Split on double pipes and re-add single pipe at start/end
        const rowParts = line.split('||').map(part => part.trim());
        for (let part of rowParts) {
          if (part) fixedLines.push('|' + part.replace(/^\|/, '').replace(/\|$/, '') + '|');
        }
        continue;
      }
    }
    if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
    fixedLines.push(line);
  }
  return fixedLines.join('\n');
}

const AffiliateArticleIdeaGeneratorPage: React.FC = () => {
  const [subNiche, setSubNiche] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const theme = useTheme();

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setAiResponse(null);
    abortController.current = new AbortController();
    try {
      const response = await fetch(getApiUrl("/api/affiliate-article-ideas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: ONBOARDING_MESSAGE,
          sub_niche: subNiche,
        }),
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
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundImage: `url(${import.meta.env.BASE_URL}images/android-chrome-512x512.png)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.92)' : 'rgba(255,255,255,0.85)' }}>
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
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 6, p: 2, position: "relative", minHeight: 400 }}>
          <Typography variant="h4" gutterBottom>
            Targeted Affiliate Article Idea Generator
          </Typography>
          <Paper elevation={3} sx={{ mt: 2, p: 2, background: theme.palette.mode === 'dark' ? '#232936' : '#fff', color: theme.palette.text.primary }}>
            <ReactMarkdown>{ONBOARDING_MESSAGE}</ReactMarkdown>
          </Paper>
          <TextField
            label="Enter your sub-niche (e.g., smart home gadgets)"
            variant="outlined"
            fullWidth
            value={subNiche}
            onChange={e => setSubNiche(e.target.value)}
            sx={{ my: 2 }}
            disabled={loading}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!subNiche.trim() || loading}
            >
              Generate Affiliate Article Ideas
            </Button>
            {loading && (
              <Button variant="outlined" color="secondary" onClick={() => abortController.current?.abort()}>
                Stop
              </Button>
            )}
          </Box>
          {aiResponse && (
            <Box sx={{ mt: 4, mb: 2, px: { xs: 0, sm: 2 } }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Affiliate Article Ideas & Keywords
              </Typography>
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
                {fixMarkdownTable(aiResponse)}
              </ReactMarkdown>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>How to Prioritize & Use These Ideas</Typography>
                <ReactMarkdown>{`
1. **Start with Buyer Intent:** Focus first on article ideas that clearly signal a purchase intent (e.g., "best", "top", "review").
2. **Check Keyword Difficulty:** Use tools like Ahrefs, SEMrush, or Google Keyword Planner to confirm the long-tail keywords are low-competition.
3. **Sequence for SEO Growth:** Publish easier-to-rank articles first to build topical authority, then target more competitive keywords.
4. **Diversify Content:** Mix product roundups, comparisons, and single product reviews to cover a range of buyer needs.
5. **Optimize for Conversions:** Include product comparisons, pros/cons, and personal recommendations in your articles.
6. **Track & Adjust:** Monitor which articles drive the most clicks and conversions, and double down on those topics.

*Tip: Comprehensive, high-quality content that answers real buyer questions will always perform best!*
`}</ReactMarkdown>
              </Box>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
        </Box>
      </Box>
    </>
  );
};

export default AffiliateArticleIdeaGeneratorPage; 