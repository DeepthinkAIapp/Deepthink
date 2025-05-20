export interface BlogPostContent {
  introduction: string;
  conclusion: string;
  keywords?: string[];
  [key: string]: any;
}

export interface CaseStudy {
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  imageMetadata: {
    alt: string;
    width: number;
    height: number;
    format: string;
    priority: boolean;
  };
  content: BlogPostContent;
  relatedPosts?: string[];
  caseStudy?: CaseStudy;
  faqs?: FAQ[];
}

export interface BlogPosts {
  [key: string]: BlogPost;
} 