import { Box, Container, Typography, Paper, Grid, List, ListItem, ListItemText, Divider, Breadcrumbs, Link, Button, Accordion, AccordionSummary, AccordionDetails, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Helmet } from 'react-helmet-async';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  backgroundColor: '#ffffff',
}));

const FeaturedImage = styled('img')({
  width: '100%',
  height: '500px',
  objectFit: 'cover',
  borderRadius: '12px',
  marginBottom: '2rem',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.main,
  fontWeight: 700,
  fontSize: '2rem',
}));

const SubSectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1.5rem',
}));

const StyledListItem = styled(ListItem)(() => ({
  paddingLeft: 0,
  '& .MuiListItemText-primary': {
    fontSize: '1.1rem',
    lineHeight: 1.6,
  },
}));

const BlogPost = () => {
  const { id } = useParams();
  const post = blogPosts[id as keyof typeof blogPosts];

  if (!post) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" align="center">
            Blog post not found
          </Typography>
        </Box>
      </Container>
    );
  }

  // SEO meta and structured data
  const canonicalUrl = `https://deepthinkai.app/blog/${post.id}`;
  const imageUrl = `https://deepthinkai.app${post.image}`;
  const description = post.content.introduction.slice(0, 155);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: description,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Deepthink AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://deepthinkai.app/images/logo.png',
      },
    },
  };

  // Social share handlers (placeholder)
  const handleShare = (platform: string) => {
    window.alert(`Share on ${platform} coming soon!`);
  };

  return (
    <Container maxWidth="lg" sx={{ background: 'linear-gradient(to bottom, #2196f3 0%, #ffffff 100%)', minHeight: '100vh', py: 0 }}>
      <Helmet>
        <title>{post.title} | Deepthink AI Blog</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:title" content={post.title + ' | Deepthink AI Blog'} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={imageUrl} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title + ' | Deepthink AI Blog'} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Box sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Home
          </Link>
          <Link component={RouterLink} to="/blog" color="inherit">
            Blog
          </Link>
          <Typography color="text.primary">{post.title}</Typography>
        </Breadcrumbs>

        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 800,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            lineHeight: 1.2,
            mb: 3
          }}
        >
          {post.title}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          color: 'text.secondary',
          flexWrap: 'wrap',
          fontSize: { xs: '0.95rem', md: '1rem' }
        }}>
          <Typography variant="subtitle1">
            {post.author}
          </Typography>
          <Typography variant="subtitle1">•</Typography>
          <Typography variant="subtitle1">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
          <Typography variant="subtitle1">•</Typography>
          <Typography variant="subtitle1">
            {post.readTime}
          </Typography>
        </Box>

        <FeaturedImage 
          src={post.image}
          alt={post.title}
        />

        <StyledPaper>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontSize: '1.25rem',
              lineHeight: 1.6,
              color: 'text.primary',
              mb: 4
            }}
          >
            {post.content.introduction}
          </Typography>

          {Object.entries(post.content).map(([key, section]) => {
            if (key === 'introduction' || key === 'conclusion') return null;
            
            return (
              <Box key={key} sx={{ mb: 6 }}>
                <SectionTitle variant="h2">
                  {section.title}
                </SectionTitle>
                
                {section.description && (
                  <Typography 
                    paragraph 
                    sx={{ 
                      fontSize: '1.1rem',
                      lineHeight: 1.8,
                      color: 'text.secondary',
                      mb: 4
                    }}
                  >
                    {section.description}
                  </Typography>
                )}

                {section.models && (
                  <>
                    <SubSectionTitle variant="h3">
                      Multi-Model Integration
                    </SubSectionTitle>
                    <List>
                      {section.models.map((model: string, index: number) => (
                        <StyledListItem key={index}>
                          <ListItemText primary={model} />
                        </StyledListItem>
                      ))}
                    </List>
                  </>
                )}

                {section.factors && (
                  <List>
                    {section.factors.map((factor: string, index: number) => (
                      <StyledListItem key={index}>
                        <ListItemText primary={factor} />
                      </StyledListItem>
                    ))}
                  </List>
                )}

                {section.tools && (
                  <>
                    {section.tools.map((tool: any, index: number) => (
                      <Box key={index} sx={{ mb: 6 }}>
                        <SubSectionTitle variant="h3">
                          {tool.name}
                        </SubSectionTitle>
                        <List>
                          {tool.features.map((feature: string, featureIndex: number) => (
                            <StyledListItem key={featureIndex}>
                              <ListItemText primary={feature} />
                            </StyledListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </>
                )}

                {section.features && (
                  <Grid container spacing={4}>
                    {Object.entries(section.features).map(([featureType, features]: [string, any]) => (
                      <Grid item xs={12} md={4} key={featureType}>
                        <SubSectionTitle variant="h3">
                          {featureType.charAt(0).toUpperCase() + featureType.slice(1)}
                        </SubSectionTitle>
                        <List>
                          {features.map((feature: string, index: number) => (
                            <StyledListItem key={index}>
                              <ListItemText primary={feature} />
                            </StyledListItem>
                          ))}
                        </List>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {section.categories && (
                  <Grid container spacing={4}>
                    {section.categories.map((category: any, index: number) => (
                      <Grid item xs={12} md={4} key={index}>
                        <SubSectionTitle variant="h3">
                          {category.name}
                        </SubSectionTitle>
                        <List>
                          {category.points.map((point: string, pointIndex: number) => (
                            <StyledListItem key={pointIndex}>
                              <ListItemText primary={point} />
                            </StyledListItem>
                          ))}
                        </List>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {section.plans && (
                  <List>
                    {section.plans.map((plan: string, index: number) => (
                      <StyledListItem key={index}>
                        <ListItemText primary={plan} />
                      </StyledListItem>
                    ))}
                  </List>
                )}
              </Box>
            );
          })}

          {/* Case Study Section */}
          {post.caseStudy && (
            <Box sx={{ my: 6, p: { xs: 2, md: 4 }, bgcolor: 'grey.100', borderRadius: 2 }}>
              <SectionTitle variant="h2" sx={{ fontSize: '1.7rem', color: 'primary.dark' }}>
                {post.caseStudy.title}
              </SectionTitle>
              <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                {post.caseStudy.description}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 6 }} />

          <SectionTitle variant="h2">
            Conclusion
          </SectionTitle>
          <Typography 
            paragraph 
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: 'text.secondary'
            }}
          >
            {post.content.conclusion}
          </Typography>

          {/* FAQ Section */}
          {post.faqs && post.faqs.length > 0 && (
            <Box sx={{ my: 6 }}>
              <SectionTitle variant="h2" sx={{ fontSize: '1.7rem' }}>
                Frequently Asked Questions
              </SectionTitle>
              {post.faqs.map((faq: any, idx: number) => (
                <Accordion key={idx} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{faq.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Share Section */}
          <Box sx={{ mt: 6, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShareIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
              Share this post:
            </Typography>
            <IconButton onClick={() => handleShare('Facebook')} color="primary" aria-label="Share on Facebook">
              <FacebookIcon />
            </IconButton>
            <IconButton onClick={() => handleShare('Twitter')} color="primary" aria-label="Share on Twitter">
              <TwitterIcon />
            </IconButton>
            <IconButton onClick={() => handleShare('LinkedIn')} color="primary" aria-label="Share on LinkedIn">
              <LinkedInIcon />
            </IconButton>
          </Box>

          {/* CTA Button */}
          <Box sx={{ mt: 4, p: 4, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
              Ready to Get Started?
            </Typography>
            <Typography sx={{ color: 'white', mb: 2 }}>
              All our AI tools are completely free to use. Start enhancing your productivity today!
            </Typography>
            <Button 
              component={RouterLink} 
              to="/"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ fontWeight: 700 }}
            >
              Try Our Free Tools Now
            </Button>
          </Box>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default BlogPost; 