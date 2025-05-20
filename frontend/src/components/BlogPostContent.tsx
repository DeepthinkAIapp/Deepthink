import { Box, Typography, Container, Paper, Link as MuiLink } from '@mui/material';
import { BlogPost } from '../types/blog';
import { blogPosts } from '../data/blogPosts';
import BlogSidebar from './BlogSidebar';
import React from 'react';
import { useTheme } from '@mui/material/styles';

interface BlogPostContentProps {
  post: BlogPost;
  postIndex?: number;
}

const getSectionId = (key: string) => `section-${key}`;

// Utility function to add DeepThink links
const addDeepThinkLinks = (text: string, minLinks: number = 2) => {
  if (!text.includes('DeepThink')) return text;

  let linkCount = 0;
  const parts = text.split(/(DeepThink)/g);
  
  return parts.map((part, index) => {
    if (part === 'DeepThink') {
      // Always link the first two occurrences
      if (linkCount < minLinks) {
        linkCount++;
        return (
          <MuiLink
            key={index}
            href="https://deepthinkai.app/chat"
            target="_blank"
            rel="noopener"
            sx={{
              color: '#ff6600',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {part}
          </MuiLink>
        );
      }
    }
    return part;
  });
};

const BlogPostContent = ({ post, postIndex }: BlogPostContentProps) => {
  const content = post.content;
  const theme = useTheme();

  // Helper to render text with DeepThink links
  const renderText = (text: string) => (
    <Typography
      variant="body1"
      paragraph
      sx={{
        lineHeight: 1.8,
        fontSize: '1.1rem',
        color: '#444',
      }}
    >
      {addDeepThinkLinks(text)}
    </Typography>
  );

  // Helper to render a list of items with a more conversational tone
  const renderList = (items: any[], isObj = false) => (
    <Box component="ul" sx={{ pl: 4, mb: 2 }}>
      {items.map((item, idx) => (
        <Typography
          key={idx}
          component="li"
          variant="body1"
          paragraph
          sx={{
            lineHeight: 1.8,
            fontStyle: 'normal',
            '&:first-letter': {
              textTransform: 'lowercase',
            },
          }}
        >
          {isObj ? (item.name ? <b>{item.name}:</b> : null) : null}{' '}
          {isObj
            ? addDeepThinkLinks(
                item.description ||
                  item.features ||
                  item.points ||
                  item.examples ||
                  item.strategies ||
                  item.aspects ||
                  item.actions
              )
            : addDeepThinkLinks(item)}
        </Typography>
      ))}
    </Box>
  );

  // Helper to render FAQs with a more personal touch
  const renderFaqs = (faqs: any[]) => (
    <Box sx={{ mt: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          lineHeight: 1.8,
          color: '#ff6600',
          borderBottom: '2px solid #ff6600',
          pb: 2,
          mb: 3
        }}
      >
        Common Questions You Might Have
      </Typography>
      {faqs.map((faq, idx) => (
        <Paper 
          key={idx} 
          sx={{ 
            mb: 3,
            p: 3,
            borderRadius: 2,
            background: idx % 2 === 0 ? '#fff7f0' : '#fff',
            border: '1px solid #ffd6b3',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(255, 102, 0, 0.1)'
            }
          }}
        >
          <Typography 
            variant="subtitle1" 
            fontWeight={700} 
            sx={{ 
              lineHeight: 1.8,
              color: '#ff6600',
              mb: 1
            }}
          >
            {faq.question}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              ml: 2, 
              lineHeight: 1.8, 
              fontStyle: 'italic',
              color: '#444'
            }}
          >
            {faq.answer}
          </Typography>
        </Paper>
      ))}
    </Box>
  );

  // Helper to render real-world stories with a more personal touch
  const renderStories = (stories: any[]) => (
    <Box sx={{ mt: 4 }}>
      {stories.map((story, idx) => (
        <Paper 
          key={idx} 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: '#fff7f0', 
            borderLeft: '4px solid #ff6600',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(255, 102, 0, 0.1)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateX(4px)'
            }
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              fontStyle: 'italic', 
              lineHeight: 1.8,
              color: '#444',
              fontSize: '1.1rem'
            }}
          >
            "{story.quote}"
          </Typography>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mt: 2, 
              color: '#ff6600', 
              lineHeight: 1.8,
              fontWeight: 600
            }}
          >
            — {story.author}
          </Typography>
        </Paper>
      ))}
    </Box>
  );

  // Helper to render pro tips with a more conversational tone
  const renderProTips = (tips: any[]) => (
    <Box sx={{ mt: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          lineHeight: 1.8,
          color: '#ff6600',
          borderBottom: '2px solid #ff6600',
          pb: 2,
          mb: 3
        }}
      >
        Tips & Tricks I've Learned Along the Way
      </Typography>
      {renderList(tips)}
    </Box>
  );

  // Helper to render step-by-step with a more personal and visually engaging style
  const renderStepByStep = (stepByStep: any) => (
    <Box
      sx={{
        mt: 4,
        mb: 4,
        p: { xs: 2, sm: 4 },
        background: '#fff7f0',
        borderRadius: 3,
        border: '2px solid #ffb366',
        boxShadow: '0 4px 24px rgba(255, 102, 0, 0.08)',
        maxWidth: '900px',
        mx: 'auto',
      }}
      id={getSectionId('stepByStep')}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          lineHeight: 1.8,
          color: '#ff6600',
          borderBottom: '2px solid #ff6600',
          pb: 2,
          mb: 3,
          textAlign: 'center',
          letterSpacing: 1,
        }}
      >
        {stepByStep.title || "Here's How I Do It"}
      </Typography>
      <Box component="ol" sx={{ pl: 0, m: 0, listStyle: 'none' }}>
        {stepByStep.steps && stepByStep.steps.map((step: string, idx: number) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              background: idx % 2 === 0 ? '#fff' : '#ffe0cc',
              borderRadius: 2,
              mb: 2,
              p: { xs: 2, sm: 3 },
              boxShadow: '0 2px 8px rgba(255, 102, 0, 0.04)',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(255, 102, 0, 0.10)',
              },
            }}
          >
            <Box
              sx={{
                minWidth: 40,
                height: 40,
                background: '#ff6600',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
                mr: 3,
                boxShadow: '0 2px 8px #ff660033',
                mt: 0.5,
              }}
            >
              {idx + 1}
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.13rem',
                color: '#333',
                lineHeight: 1.8,
                fontWeight: 500,
              }}
            >
              {step}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  // Helper to map tool names to their internal routes
  const toolLinks: Record<string, string> = {
    'Monetization Planner': '/monetization-planner',
    'Guest Post Outreach': '/guest-post-outreach',
    'Search Intent Tool': '/search-intent-tool',
    'AI Image Generator': '/ai-image-generator',
    'Content Creator Machine': '/content-creator-machine',
    'Affiliate Article Ideas': '/affiliate-article-idea-generator',
    'YouTube Content Planner': '/youtube-content-planner',
    'Video Generator': '/video-generator',
    'Website Authority Checker': '/website-authority-checker',
  };

  // Helper to render tool highlights
  const renderToolHighlights = (toolHighlights: any) => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ lineHeight: 1.8 }}>{toolHighlights.title || 'DeepThink AI Tools'}</Typography>
      <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>{toolHighlights.description}</Typography>
      <Box>
        {toolHighlights.tools && toolHighlights.tools.map((tool: any, idx: number) => (
          <Paper key={idx} sx={{ p: 2, mb: 2, background: '#fff7f0', borderLeft: '4px solid #ff6600' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.8 }}>
              {toolLinks[tool.name] ? (
                <MuiLink 
                  href={toolLinks[tool.name]} 
                  underline="hover" 
                  sx={{ color: '#ff6600', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#ff8533' } }}
                >
                  {tool.name}
                </MuiLink>
              ) : (
                tool.name
              )}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{tool.description}</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );

  // Helper to render whyAI
  const renderWhyAI = (whyAI: any) => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ lineHeight: 1.8 }}>{whyAI.title || 'Why AI?'}</Typography>
      <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>{whyAI.description}</Typography>
    </Box>
  );

  // Get section keys for ToC
  const tocSections = [
    ...(
      [
        ['introduction', content.introduction && 'Introduction'],
        ['technology', content.technology && (content.technology.title || 'Technology')],
        ['features', content.features && (content.features.title || 'Features')],
        ['applications', content.applications && (content.applications.title || 'Applications')],
        ['benefits', content.benefits && (content.benefits.title || 'Benefits')],
        ['stepByStep', content.stepByStep && (content.stepByStep.title || 'Step-by-Step Guide')],
        ['realWorld', content.realWorld && (content.realWorld.title || 'Real-World Success Stories')],
        ['proTips', content.proTips && (content.proTips.title || 'Pro Tips & Best Practices')],
        ['faqs', content.faqs && 'FAQs'],
        ['conclusion', content.conclusion && 'Conclusion'],
        ['editorial', content.editorial && 'Editorial'],
      ].filter(([key, title]) => !!title).map(([key, title]) => ({ key, title }))
    )
  ];

  // List of main content section keys in order (excluding intro, conclusion, editorial, keywords)
  const mainSectionKeys = [
    'technology',
    'features',
    'applications',
    'benefits',
    'stepByStep',
    'realWorld',
    'proTips',
    'faqs',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Hero Image */}
          <Box
            component="img"
            src={post.image}
            alt={post.imageMetadata.alt}
            loading="lazy"
            width="100%"
            height="auto"
            sx={{
              maxHeight: '500px',
              objectFit: 'cover',
              borderRadius: 2,
              mb: 4,
            }}
          />

          {/* Title and Meta */}
          <Typography variant="h3" component="h1" gutterBottom sx={{ lineHeight: 1.8 }}>
            {post.title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>By {post.author}</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{post.date}</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{post.readTime}</Typography>
          </Box>

          {/* Table of Contents: Only show in main content on mobile */}
          {tocSections.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, mb: 4, background: '#f5f7fa', display: { xs: 'block', md: 'none' } }}>
              <Typography variant="h5" gutterBottom sx={{ lineHeight: 1.8 }}>Table of Contents</Typography>
              <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                {tocSections.map(({ key, title }) => (
                  <li key={key}>
                    <MuiLink href={`#${getSectionId(key)}`} underline="hover" color="primary" sx={{ lineHeight: 1.8 }}>
                      {title}
                    </MuiLink>
                  </li>
                ))}
              </Box>
            </Paper>
          )}

          {/* Introduction */}
          {content.introduction && (
            <Paper
              elevation={3}
              sx={{
                p: 4,
                mb: 4,
                backgroundColor: '#fff',
                borderLeft: '8px solid #ff6600',
                borderRadius: 3,
                boxShadow: '0 4px 24px #ff660033',
                fontSize: '1.18rem',
                maxWidth: '900px',
                mx: 'auto',
                fontStyle: 'italic'
              }}
              id={getSectionId('introduction')}
            >
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  fontSize: '1.18rem', 
                  fontWeight: 500, 
                  color: '#222', 
                  lineHeight: 1.8 
                }}
              >
                {addDeepThinkLinks(content.introduction)}
              </Typography>
            </Paper>
          )}

          {/* Main Sections: alternate card style */}
          {mainSectionKeys.map((key, idx) => {
            const section = content[key];
            if (!section) return null;
            let sectionContent = null;
            switch (key) {
              case 'technology':
                sectionContent = (
                  <Box sx={{ mt: 4 }} id={getSectionId('technology')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Technology'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: '#444'
                      }}
                    >
                      {addDeepThinkLinks(section.description)}
                    </Typography>
                    {section.components && renderList(section.components)}
                  </Box>
                );
                break;
              case 'features':
                sectionContent = (
                  <Box sx={{ mt: 4 }} id={getSectionId('features')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Features'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: '#444'
                      }}
                    >
                      {addDeepThinkLinks(section.description)}
                    </Typography>
                    {section.capabilities && section.capabilities.map((cap: any, i: number) => (
                      <Box key={i} sx={{ mb: 3 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={700} 
                          sx={{ 
                            lineHeight: 1.8,
                            color: idx % 2 === 1 ? '#ff6600' : '#333',
                            mb: 1
                          }}
                        >
                          {cap.name}
                        </Typography>
                        {cap.features && renderList(cap.features)}
                      </Box>
                    ))}
                  </Box>
                );
                break;
              case 'applications':
                sectionContent = (
                  <Box sx={{ mt: 4 }} id={getSectionId('applications')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Applications'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: '#444'
                      }}
                    >
                      {addDeepThinkLinks(section.description)}
                    </Typography>
                    {section.useCases && section.useCases.map((use: any, i: number) => (
                      <Box key={i} sx={{ mb: 3 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={700} 
                          sx={{ 
                            lineHeight: 1.8,
                            color: idx % 2 === 1 ? '#ff6600' : '#333',
                            mb: 1
                          }}
                        >
                          {use.name}
                        </Typography>
                        {use.examples && renderList(use.examples)}
                      </Box>
                    ))}
                  </Box>
                );
                break;
              case 'benefits':
                sectionContent = (
                  <Box sx={{ mt: 4 }} id={getSectionId('benefits')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Benefits'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: '#444'
                      }}
                    >
                      {addDeepThinkLinks(section.description)}
                    </Typography>
                    {section.advantages && section.advantages.map((adv: any, i: number) => (
                      <Box key={i} sx={{ mb: 3 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={700} 
                          sx={{ 
                            lineHeight: 1.8,
                            color: idx % 2 === 1 ? '#ff6600' : '#333',
                            mb: 1
                          }}
                        >
                          {adv.name}
                        </Typography>
                        {adv.points && renderList(adv.points)}
                      </Box>
                    ))}
                  </Box>
                );
                break;
              case 'stepByStep':
                sectionContent = renderStepByStep(section);
                break;
              case 'realWorld':
                sectionContent = section.stories && (typeof (window) === 'undefined' || !('postIndex' in BlogPostContent) || (typeof postIndex === 'number' && postIndex % 4 === 0)) ? (
                  <Box sx={{ mt: 4 }} id={getSectionId('realWorld')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Real-World Success Stories'}
                    </Typography>
                    {renderStories(section.stories)}
                  </Box>
                ) : null;
                break;
              case 'proTips':
                sectionContent = section.tips ? (
                  <Box sx={{ mt: 4 }} id={getSectionId('proTips')}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      sx={{ 
                        lineHeight: 1.8,
                        color: idx % 2 === 1 ? '#ff6600' : 'inherit',
                        mb: 3
                      }}
                    >
                      {section.title || 'Pro Tips & Best Practices'}
                    </Typography>
                    {renderList(section.tips)}
                  </Box>
                ) : null;
                break;
              case 'faqs':
                sectionContent = (
                  <Box sx={{ mt: 4 }} id={getSectionId('faqs')}>
                    {renderFaqs(section)}
                  </Box>
                );
                break;
              default:
                sectionContent = null;
            }
            if (!sectionContent) return null;
            // Even-indexed sections normal
            return (
              <Box 
                key={key}
                sx={{
                  position: 'relative',
                  maxWidth: '900px',
                  mx: 'auto',
                  mb: 4,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '-24px',
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: 'linear-gradient(180deg, #ff6600 0%, transparent 100%)',
                    borderRadius: '4px',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, #ff660066 50%, transparent 100%)',
                  }
                }}
              >
                <Box sx={{ pl: 3 }}>
                  {sectionContent}
                </Box>
              </Box>
            );
          })}

          {/* Conclusion - always at the end of main content */}
          {content.conclusion && (
            <Box 
              sx={{ 
                mt: 6,
                mb: 4,
                p: 4,
                background: '#fff7f0',
                borderRadius: 3,
                border: '1px solid #ffd6b3',
                boxShadow: '0 4px 24px rgba(255, 102, 0, 0.1)'
              }} 
              id={getSectionId('conclusion')}
            >
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  lineHeight: 1.8,
                  color: '#ff6600',
                  borderBottom: '2px solid #ff6600',
                  pb: 2,
                  mb: 3
                }}
              >
                Wrapping It Up
              </Typography>
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  lineHeight: 1.8, 
                  fontStyle: 'italic',
                  color: '#444',
                  fontSize: '1.1rem'
                }}
              >
                {addDeepThinkLinks(content.conclusion)}
              </Typography>
            </Box>
          )}

          {/* Editorial/Author Section */}
          {content.editorial && (
            <Box
              sx={{
                mt: 6,
                mb: 4,
                p: 3,
                background: theme => theme.palette.mode === 'dark' ? '#232936' : '#f9f9fa',
                borderRadius: 3,
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'dark' ? '#333' : '#eee',
                boxShadow: '0 2px 12px #ff660015',
                color: theme => theme.palette.text.primary,
              }}
              id={getSectionId('editorial')}
            >
              <Typography variant="body2" sx={{ color: theme => theme.palette.text.secondary, mb: 1, lineHeight: 1.8 }}>
                Last Updated on {content.editorial.lastUpdated}
              </Typography>
              <Typography variant="h5" sx={{ color: '#ff6600', fontWeight: 700, mb: 1, lineHeight: 1.8 }}>
                Editorial Process
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: theme => theme.palette.text.primary }}>
                {content.editorial.process}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box component="img" src={content.editorial.author.image} alt={content.editorial.author.name} sx={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff6600' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.8, color: theme => theme.palette.text.primary }}>
                    {content.editorial.author.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8, color: theme => theme.palette.text.secondary }}>
                    {content.editorial.author.bio}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {content.editorial.author.social?.map((s: any, i: number) => (
                      <MuiLink key={i} href={s.url} target="_blank" rel="noopener" sx={{ color: '#ff6600', fontSize: 22, mr: 1 }}>
                        {s.type === 'website' && <span role="img" aria-label="Website">🌐</span>}
                        {s.type === 'twitter' && <span role="img" aria-label="Twitter">🐦</span>}
                        {s.type === 'github' && <span role="img" aria-label="GitHub">💻</span>}
                      </MuiLink>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Related Posts */}
          {post.relatedPosts && (
            <Box sx={{ mt: 6 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ lineHeight: 1.8 }}>
                Related Articles
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)'
                }, 
                gap: 3 
              }}>
                {(() => {
                  // Get the related posts
                  const relatedPostsData = post.relatedPosts
                    .map(id => ({ id, post: blogPosts[id as keyof typeof blogPosts] }))
                    .filter(({ post }) => post);

                  // Get other posts to fill up to 4 if needed
                  const otherPosts = Object.entries(blogPosts)
                    .filter(([id]) => 
                      id !== post.id && 
                      !post.relatedPosts.includes(id)
                    )
                    .map(([id, post]) => ({ id, post }))
                    .slice(0, 4 - relatedPostsData.length);

                  // Combine related and other posts
                  const allPosts = [...relatedPostsData, ...otherPosts];

                  return allPosts.slice(0, 4).map(({ id, post: relatedPost }) => (
                    <Paper
                      key={id}
                      component={MuiLink}
                      href={`/blog/${id}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        textDecoration: 'none',
                        color: 'inherit',
                        border: '2px solid transparent',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          border: '2px solid #ff6600',
                          boxShadow: '0 4px 16px #ff660033',
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={relatedPost.image}
                        alt={relatedPost.imageMetadata.alt}
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom 
                          sx={{ 
                            lineHeight: 1.4,
                            mb: 1,
                            fontWeight: 600,
                            color: 'primary.main'
                          }}
                        >
                          {relatedPost.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flexGrow: 1
                          }}
                        >
                          {relatedPost.content.introduction.slice(0, 120)}...
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {relatedPost.readTime}
                          </Typography>
                          <Typography 
                            variant="subtitle2" 
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            Read More →
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ));
                })()}
              </Box>
            </Box>
          )}
        </Box>
        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          <BlogSidebar post={post} tocSections={tocSections} />
        </Box>
      </Box>
    </Container>
  );
};

export default BlogPostContent; 