import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, CardActionArea, Breadcrumbs, Link, Divider, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { blogPosts as blogPostsObj } from '../data/blogPosts';
import { useState, useRef, useEffect } from 'react';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const blogPosts = Object.values(blogPostsObj);

const BlogCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
}));

const SidebarBox = styled(Box)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    position: 'sticky',
    top: theme.spacing(10),
  },
  background: theme.palette.grey[50],
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  marginBottom: theme.spacing(4),
}));

const BlogPage = () => {
  // Sort all posts by date (newest first)
  const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [visibleCount, setVisibleCount] = useState(6);
  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sidebar logic remains unchanged
  const recentPosts = sortedPosts.slice(0, 5);
  const mostViewedPosts = blogPosts.slice(0, 3);

  // Infinite scroll effect
  useEffect(() => {
    if (sortedPosts.length <= 6) return; // No infinite scroll if 6 or fewer
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < sortedPosts.length) {
          setVisibleCount((c) => Math.min(c + 6, sortedPosts.length));
        }
      },
      { threshold: 1 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, [visibleCount, sortedPosts.length]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ background: 'linear-gradient(to bottom, #2196f3 0%, #ffffff 100%)', minHeight: '100vh' }}>
      <Helmet>
        <title>Deepthink AI Blog | Free AI Tools, Guides & Insights</title>
        <meta name="description" content="Explore the Deepthink AI Blog for the latest on free AI tools, content creation, image generation, SEO, monetization, and more. Discover how to supercharge your workflow with Deepthink AI." />
        <link rel="canonical" href="https://yourdomain.com/blog" />
        {/* Open Graph */}
        <meta property="og:title" content="Deepthink AI Blog | Free AI Tools, Guides & Insights" />
        <meta property="og:description" content="Explore the Deepthink AI Blog for the latest on free AI tools, content creation, image generation, SEO, monetization, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/blog" />
        <meta property="og:image" content="https://yourdomain.com/images/Leonardo_Phoenix_10_A_futuristic_sleek_robotic_AI_figure_with_0.jpg" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Deepthink AI Blog | Free AI Tools, Guides & Insights" />
        <meta name="twitter:description" content="Explore the Deepthink AI Blog for the latest on free AI tools, content creation, image generation, SEO, monetization, and more." />
        <meta name="twitter:image" content="https://yourdomain.com/images/Leonardo_Phoenix_10_A_futuristic_sleek_robotic_AI_figure_with_0.jpg" />
      </Helmet>
      {/* HERO SECTION WITH VIDEO/IMAGE */}
      <Box sx={{
        bgcolor: 'primary.dark',
        pt: { xs: 6, md: 10 },
        pb: { xs: 4, md: 8 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: 3,
          p: { xs: 1, md: 2 },
          mb: 4,
          maxWidth: 480,
          width: '100%',
          position: 'relative',
        }}>
          <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, md: 320 }, overflow: 'hidden', borderRadius: 3 }}>
            <img
              src="/images/Leonardo_Phoenix_10_A_futuristic_sleek_robotic_AI_figure_with_0.jpg"
              alt="Deepthink AI Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            />
            <PlayCircleFilledWhiteIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 64,
                color: 'primary.main',
                opacity: 0.85,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
              onClick={() => window.location.href = '/'}
            />
          </Box>
        </Box>
        {/* CTA BUTTON */}
        <Button
          variant="contained"
          color="info"
          size="large"
          sx={{
            fontWeight: 700,
            fontSize: '1.3rem',
            px: 5,
            py: 2,
            mb: 4,
            borderRadius: 2,
            boxShadow: 2
          }}
          onClick={() => window.location.href = '/'}
        >
          Try our FREE DEEPTHINK AI tools now
        </Button>
        {/* STATS/FEATURES BAR */}
        <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 900, mx: 'auto', mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, textAlign: 'center', boxShadow: 1 }}>
              <PeopleIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>10,000+ Users</Typography>
              <Typography variant="body2" color="text.secondary">People have used Deepthink AI tools.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, textAlign: 'center', boxShadow: 1 }}>
              <SchoolIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>6 Powerful AI Tools</Typography>
              <Typography variant="body2" color="text.secondary">Content, Images, SEO, Monetization, Outreach, and more.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, textAlign: 'center', boxShadow: 1 }}>
              <SupportAgentIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>All-in-One Platform</Typography>
              <Typography variant="body2" color="text.secondary">For creators, marketers, and entrepreneurs.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, textAlign: 'center', boxShadow: 1 }}>
              <MonetizationOnIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>100% Free</Typography>
              <Typography variant="body2" color="text.secondary">No credit card needed. Start instantly.</Typography>
            </Box>
          </Grid>
        </Grid>
        {/* PROMPT INSPIRATION SECTION */}
        <Box sx={{
          bgcolor: 'background.paper',
          py: { xs: 4, md: 6 },
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Prompt Inspiration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, textAlign: 'center' }}>
            Get inspired by top AI-generated images and prompts from the community. Explore creative ideas and see what's possible with Deepthink AI and PromptHero!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
            <img src="/images/Leonardo_Phoenix_10_A_futuristic_AI_chat_assistant_depicted_as_3.jpg" alt="PromptHero Sample 1" style={{ width: 180, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <img src="/images/prompthero-prompt-fceab06c6e2.webp" alt="PromptHero Sample 2" style={{ width: 180, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <img src="/images/Flux_Dev_a_futuristic_landscape_depicting_a_legion_of_advanced_1.jpg" alt="PromptHero Sample 3" style={{ width: 180, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
          </Box>
          <Button
            variant="outlined"
            color="primary"
            href="https://prompthero.com/top"
            target="_blank"
            rel="noopener"
            sx={{ fontWeight: 600, mt: 1 }}
          >
            See More on PromptHero
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Images & prompts courtesy of <a href="https://prompthero.com/top" target="_blank" rel="noopener" style={{ color: '#1976d2', textDecoration: 'underline' }}>PromptHero</a>
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="lg">
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Home
          </Link>
          <Typography color="text.primary">Blog</Typography>
        </Breadcrumbs>

        <Grid container spacing={6}>
          {/* Main Blog Grid */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              {visiblePosts.map((post) => (
                <Grid item xs={12} sm={6} key={post.id}>
                  <CardActionArea 
                    component={RouterLink} 
                    to={`/blog/${post.id}`}
                    sx={{ height: '100%' }}
                  >
                    <BlogCard>
                      <CardMedia
                        component="img"
                        height="240"
                        image={post.image}
                        alt={post.title}
                        sx={{
                          objectFit: 'cover',
                          borderBottom: '1px solid rgba(0,0,0,0.1)'
                        }}
                      />
                      <StyledCardContent>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ mb: 1 }}
                        >
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} • {post.readTime}
                        </Typography>
                        <Typography 
                          variant="h5" 
                          component="h2" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            lineHeight: 1.3,
                            mb: 2,
                            color: (isMobile && theme.palette.mode === 'dark') ? '#fff' : undefined
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            flexGrow: 1
                          }}
                        >
                          {post.content?.introduction?.slice(0, 120) + '...'}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          color="primary"
                          sx={{ 
                            mt: 2,
                            fontWeight: 600
                          }}
                        >
                          Read More →
                        </Typography>
                      </StyledCardContent>
                    </BlogCard>
                  </CardActionArea>
                </Grid>
              ))}
            </Grid>
            {/* Infinite scroll sentinel */}
            {sortedPosts.length > 6 && visibleCount < sortedPosts.length && (
              <div ref={sentinelRef} style={{ height: 40 }} />
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <SidebarBox>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Posts
              </Typography>
              {recentPosts.map((post) => (
                <Box key={post.id} sx={{ mb: 2 }}>
                  <Link component={RouterLink} to={`/blog/${post.id}`} color="primary" underline="hover">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </SidebarBox>
            <SidebarBox>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Most Viewed
              </Typography>
              {mostViewedPosts.map((post) => (
                <Box key={post.id} sx={{ mb: 2 }}>
                  <Link component={RouterLink} to={`/blog/${post.id}`} color="primary" underline="hover">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>
                  </Link>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </SidebarBox>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            mt: 8, 
            p: 6, 
            bgcolor: 'primary.light', 
            borderRadius: 2,
            textAlign: 'center',
            color: 'white'
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Ready to Transform Your Workflow?
          </Typography>
          <Typography sx={{ mb: 3, fontSize: '1.1rem' }}>
            All our AI tools are completely free to use. Start enhancing your productivity today!
          </Typography>
          <Link 
            component={RouterLink} 
            to="/" 
            sx={{ 
              color: 'white',
              textDecoration: 'underline',
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                color: 'primary.light',
              }
            }}
          >
            Try Our Free Tools Now →
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default BlogPage; 