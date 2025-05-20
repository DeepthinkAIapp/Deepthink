import { useParams } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '../data/blogPosts';
import { lazy, Suspense } from 'react';
import { BlogPost as BlogPostType } from '../types/blog';

// Lazy load the blog post content
const BlogPostContent = lazy(() => import('./BlogPostContent'));

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = id ? blogPosts[id as keyof typeof blogPosts] : null;

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

  const imageUrl = `${window.location.origin}${post.image}`;
  const canonicalUrl = `${window.location.origin}/blog/${id}`;
  const description = post.content.introduction.substring(0, 160);
  const keywords = post.content.keywords || post.title.split(' ').concat(['AI tools', 'content creation', 'SEO', 'digital marketing']);

  return (
    <Container maxWidth="lg" sx={{ background: 'linear-gradient(to bottom, #ff6600 0%, #fff 100%)', minHeight: '100vh', py: 0, borderRadius: 4, boxShadow: '0 4px 24px #ff660022', px: { xs: 0, md: 4 } }}>
      <Helmet>
        <title>{post.title} | DeepThink AI Blog</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content={post.imageMetadata.width.toString()} />
        <meta property="og:image:height" content={post.imageMetadata.height.toString()} />
        <meta property="og:image:alt" content={post.imageMetadata.alt} />
        <meta property="og:site_name" content="DeepThink AI" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:modified_time" content={post.date} />
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content="AI Tools & Technology" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={post.imageMetadata.alt} />
        <meta name="twitter:url" content={canonicalUrl} />
        
        {/* Additional SEO meta tags */}
        <meta name="keywords" content={keywords.join(', ')} />
        <meta name="author" content={post.author} />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": description,
            "image": {
              "@type": "ImageObject",
              "url": imageUrl,
              "width": post.imageMetadata.width,
              "height": post.imageMetadata.height,
              "caption": post.imageMetadata.alt
            },
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "DeepThink AI",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/images/logo.png`
              }
            },
            "datePublished": post.date,
            "dateModified": post.date,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            },
            "keywords": keywords,
            "inLanguage": "en-US",
            "isAccessibleForFree": true,
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "relatedLink": post.relatedPosts?.map(relatedId => 
              `${window.location.origin}/blog/${relatedId}`
            ) || []
          })}
        </script>
      </Helmet>
      
      {/* Lazy load the main content */}
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      }>
        <BlogPostContent post={post} />
      </Suspense>
    </Container>
  );
};

export default BlogPost; 