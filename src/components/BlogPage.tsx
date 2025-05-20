import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isVideoPaused, setIsVideoPaused] = useState(true);

  const handleVideoClick = () => {
    const video = document.getElementById('hero-video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play();
        setIsVideoPaused(false);
      } else {
        video.pause();
        setIsVideoPaused(true);
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/robot.png';
  };

  const blogPosts = [
    {
      id: 1,
      title: t('blog.posts.1.title'),
      excerpt: t('blog.posts.1.excerpt'),
      image: '/images/blog/ai-ethics.jpg',
      link: '/blog/ai-ethics',
    },
    {
      id: 2,
      title: t('blog.posts.2.title'),
      excerpt: t('blog.posts.2.excerpt'),
      image: '/images/blog/ai-future.jpg',
      link: '/blog/ai-future',
    },
    {
      id: 3,
      title: t('blog.posts.3.title'),
      excerpt: t('blog.posts.3.excerpt'),
      image: '/images/blog/ai-education.jpg',
      link: '/blog/ai-education',
    },
  ];

  const promptInspiration = [
    {
      id: 1,
      title: t('blog.prompts.1.title'),
      description: t('blog.prompts.1.description'),
      image: '/images/blog/prompt1.jpg',
    },
    {
      id: 2,
      title: t('blog.prompts.2.title'),
      description: t('blog.prompts.2.description'),
      image: '/images/blog/prompt2.jpg',
    },
    {
      id: 3,
      title: t('blog.prompts.3.title'),
      description: t('blog.prompts.3.description'),
      image: '/images/blog/prompt3.jpg',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: isMobile ? '300px' : '500px',
            mb: 8,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <video
            id="hero-video"
            src="/images/eye.mp4"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loop
            muted
            playsInline
            onClick={handleVideoClick}
          />
          {isVideoPaused && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
                cursor: 'pointer',
              }}
              onClick={handleVideoClick}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderTop: '15px solid transparent',
                    borderBottom: '15px solid transparent',
                    borderLeft: '25px solid white',
                    ml: 1,
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Featured Posts */}
        <Typography variant="h2" sx={{ mb: 6, textAlign: 'center' }}>
          {t('blog.featuredPosts')}
        </Typography>
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {blogPosts.map((post) => (
            <Grid item xs={12} md={4} key={post.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={post.image}
                  alt={post.title}
                  onError={handleImageError}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {post.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {post.excerpt}
                  </Typography>
                  <Button
                    component={Link}
                    to={post.link}
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {t('blog.readMore')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Prompt Inspiration */}
        <Typography variant="h2" sx={{ mb: 6, textAlign: 'center' }}>
          {t('blog.promptInspiration')}
        </Typography>
        <Grid container spacing={4}>
          {promptInspiration.map((prompt) => (
            <Grid item xs={12} md={4} key={prompt.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={prompt.image}
                  alt={prompt.title}
                  onError={handleImageError}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {prompt.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {prompt.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default BlogPage; 