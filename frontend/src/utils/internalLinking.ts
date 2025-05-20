import { BlogPost } from '../types/blog';
import { blogPosts } from '../data/blogPosts';

interface LinkTarget {
  title: string;
  url: string;
  type: 'tool' | 'post';
}

// Map tool names to their internal routes
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

// Get all possible link targets (tools and posts)
const getLinkTargets = (currentPostId?: string): LinkTarget[] => {
  const targets: LinkTarget[] = [];

  // Add tool links
  Object.entries(toolLinks).forEach(([title, url]) => {
    targets.push({
      title,
      url,
      type: 'tool'
    });
  });

  // Add blog post links
  Object.entries(blogPosts).forEach(([id, post]) => {
    if (id !== currentPostId) { // Don't link to the current post
      targets.push({
        title: post.title,
        url: `/blog/${id}`,
        type: 'post'
      });
    }
  });

  return targets;
};

// Process text content to add internal links
export const addInternalLinks = (content: string, currentPostId?: string): string => {
  const targets = getLinkTargets(currentPostId);
  let processedContent = content;

  // Sort targets by title length (descending) to handle longer phrases first
  targets.sort((a, b) => b.title.length - a.title.length);

  // Create a regex that matches whole words only
  targets.forEach(target => {
    const escapedTitle = target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTitle}\\b(?![^<]*>|[^<>]*<\/)`, 'gi');
    
    // Only replace the first occurrence to avoid over-linking
    processedContent = processedContent.replace(regex, (match) => {
      return `<MuiLink href="${target.url}" sx={{ color: '#ff6600', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>${match}</MuiLink>`;
    });
  });

  return processedContent;
};

// Process a section of blog post content
export const processContentSection = (section: any, currentPostId?: string): any => {
  if (typeof section === 'string') {
    return addInternalLinks(section, currentPostId);
  }
  
  if (Array.isArray(section)) {
    return section.map(item => {
      if (typeof item === 'string') {
        return addInternalLinks(item, currentPostId);
      }
      if (typeof item === 'object' && item !== null) {
        return processContentSection(item, currentPostId);
      }
      return item;
    });
  }
  
  if (typeof section === 'object' && section !== null) {
    const processed: any = {};
    for (const [key, value] of Object.entries(section)) {
      processed[key] = processContentSection(value, currentPostId);
    }
    return processed;
  }
  
  return section;
};

// Process entire blog post content
export const processPostContent = (post: BlogPost): BlogPost => {
  const processedContent = processContentSection(post.content, post.id);
  return {
    ...post,
    content: processedContent
  };
}; 