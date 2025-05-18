import React, { useState, useRef } from "react";
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert } from "@mui/material";
import "./MonetizationPlannerPage.css";
import { useTheme } from '@mui/material/styles';
import ChatInterface from './ChatInterface';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant', content: string };

const GuestPostOutreachPage: React.FC = () => {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const theme = useTheme();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const CRYPTO_EXAMPLE = `Since your niche is crypto, I'll identify high-authority websites that accept guest posts, analyze their recent content, and suggest guest post ideas based on gaps.\n\n1. CoinDesk (https://www.coindesk.com/)\nAuthority: One of the most respected crypto news sites (DR 90+).\nGuest Post Policy: Rarely accepts unsolicited guest posts, but contributors can pitch to editorial@coindesk.com.\nRecent Topics (Last 3 Months):\n- Bitcoin ETF updates\n- Ethereum upgrades (Dencun, EIP-4844)\n- Crypto regulation (SEC vs. Ripple, MiCA in EU)\nContent Gap Opportunities:\n✅ "How Layer 2 Solutions Are Solving Ethereum's Scalability (Beginner's Guide)"\n✅ "The Hidden Risks of Staking Crypto (What No One Talks About)"\n\n2. CoinTelegraph (https://cointelegraph.com/)\nAuthority: Major crypto news outlet (DR 88).\nGuest Post Policy: Accepts contributor pitches (check editorial guidelines).\nRecent Topics:\n- Meme coin trends (Dogecoin, Shiba Inu, new hype coins)\n- CBDCs (Central Bank Digital Currencies)\n- AI + Crypto projects\nContent Gap Opportunities:\n✅ "Are Meme Coins a Scam? How to Spot the Next Pump & Dump"\n✅ "AI-Powered Crypto Projects That Aren't Just Hype"\n\n3. CryptoPotato (https://cryptopotato.com/)\nAuthority: Popular for beginner-friendly guides (DR 70+).\nGuest Post Policy: Open to guest contributors (contact via site).\nRecent Topics:\n- Crypto wallet comparisons\n- Tax guides for traders\n- Exchange reviews (Binance, Kraken, etc.)\nContent Gap Opportunities:\n✅ *"Best Cold Wallets for Long-Term Holders (2024 Comparison)"*\n✅ "How to Report Crypto Taxes in [Country] Without Getting Audited"\n\n4. NewsBTC (https://www.newsbtc.com/)\nAuthority: Focuses on trading & market analysis (DR 75+).\nGuest Post Policy: Accepts guest posts (check "Write for Us" page).\nRecent Topics:\n- Bitcoin price predictions\n- Altcoin season analysis\n- Trading bot strategies\nContent Gap Opportunities:\n✅ "How to Use Trading Bots Safely (Avoiding Common Scams)"\n✅ "Proof-of-Work vs. Proof-of-Stake: Which is More Secure?"\n\n5. Blockonomi (https://blockonomi.com/)\nAuthority: Covers crypto + blockchain tech (DR 65+).\nGuest Post Policy: Accepts guest posts (pitch via contact form).\nRecent Topics:\n- Web3 gaming projects\n- Privacy coins (Monero, Zcash)\n- NFT market trends\nContent Gap Opportunities:\n✅ "Is Web3 Gaming the Next Big Thing? Top Projects to Watch"\n✅ "Why Privacy Coins Are Gaining Popularity in 2024"\n\nBonus: More Guest Post-Friendly Crypto Sites\nBitcoinist (https://bitcoinist.com/) – Focuses on Bitcoin-centric content.\nThe Merkle (https://themerkle.com/) – Covers tech & crypto innovations.\nCryptoSlate (https://cryptoslate.com/) – Open to expert contributors.\n\nNext Steps for Guest Posting:\nReview Their Guidelines – Check each site's "Write for Us" page.\nPitch Unique Angles – Avoid rehashing old topics; focus on gaps.\nLeverage Trends – Tie ideas to recent news (e.g., ETFs, halving, regulations).\n\nWould you like help drafting a guest post pitch email template? Let me know! 🚀`;

  const handleGenerate = async () => {
    setIdeas("");
    setError(null);
    setLoading(true);
    abortController.current = new AbortController();
    let generatedIdeas = "";
    try {
      if (/crypto|bitcoin|ethereum|blockchain|web3|defi|nft/i.test(niche)) {
        generatedIdeas = CRYPTO_EXAMPLE;
        setIdeas(generatedIdeas);
        // Set chat context for the workflow
        setChatMessages([
          {
            role: 'assistant',
            content: `Context: The user is seeking guest post opportunities in the niche "${niche}". Here are the top sites and content gaps:\n\n${generatedIdeas}\n\nWhen the user asks for a custom pitch, use this context to tailor your response.`
          }
        ]);
        setLoading(false);
        return;
      }
      const prompt = `I need you to identify 5-10 high authority websites in my niche (${niche}) that have published articles within the last 3 months. These sites should accept guest posts. Analyze their sites for content gaps and ideas for good guest posts.`;
      const response = await fetch("/api/guestpost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, prompt }),
        signal: abortController.current.signal,
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullIdeas = "";
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
              if (typeof data.ideas === "string") {
                fullIdeas += data.ideas;
                setIdeas(fullIdeas);
                generatedIdeas = fullIdeas;
              }
            } catch (e) {}
          }
        }
      }
      // Set chat context for the workflow after ideas are generated
      if (generatedIdeas) {
        setChatMessages([
          {
            role: 'assistant',
            content: `Context: The user is seeking guest post opportunities in the niche "${niche}". Here are the top sites and content gaps:\n\n${generatedIdeas}\n\nWhen the user asks for a custom pitch, use this context to tailor your response.`
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

  return (
    <>
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundImage: 'url(/images/android-chrome-512x512.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.92)' : 'rgba(255,255,255,0.85)' }}>
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 6, p: 2, position: "relative", minHeight: 400 }}>
          <Typography variant="h4" gutterBottom>
            Guest Post Outreach Opportunity Finder
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Discover high-authority websites in your niche that accept guest posts, analyze their recent content, and get actionable guest post topic ideas based on real content gaps.<br />
            <b>How it works:</b> <br />
            1. Enter your niche or topic below.<br />
            2. Instantly see a list of top sites, their guest post policies, recent topics, and unique content gap opportunities.<br />
            3. Use the chat below for custom pitch help or follow-up questions!
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>Example Output (for "crypto"):</Typography>
          <Paper sx={{ p: 2, mb: 3, background: theme.palette.mode === 'dark' ? '#232936' : '#f9f9f9', color: theme.palette.mode === 'dark' ? '#f5f5f5' : '#232936', fontSize: 15 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{CRYPTO_EXAMPLE}</Typography>
          </Paper>
          <TextField
            label="Your Niche (e.g., crypto, SaaS, fitness, parenting)"
            placeholder="e.g., crypto, SaaS, fitness, parenting"
            variant="outlined"
            fullWidth
            value={niche}
            onChange={e => setNiche(e.target.value)}
            sx={{ my: 2 }}
            disabled={loading}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={!niche.trim() || loading}
            >
              Find Guest Post Opportunities
            </Button>
            {loading && (
              <Button variant="outlined" color="secondary" onClick={handleStop}>
                Stop
              </Button>
            )}
          </Box>
          {loading && (
            <Box className="centered-logo-overlay">
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
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
          {ideas && (
            <Box sx={{ mt: 4, mb: 2, px: { xs: 0, sm: 2 } }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Guest Post Outreach Ideas
              </Typography>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {ideas}
              </ReactMarkdown>
            </Box>
          )}
          {ideas && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Have follow-up questions or want a custom pitch? Chat below:
              </Typography>
              <ChatInterface
                messages={chatMessages}
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

export default GuestPostOutreachPage; 