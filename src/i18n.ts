import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: {
        title: 'Welcome to DeepThink AI',
        subtitle: 'Your intelligent companion for meaningful conversations and creative exploration',
        startTour: 'Start Tour',
        signIn: 'Sign in with Google',
      },
      blog: {
        featuredPosts: 'Featured Posts',
        promptInspiration: 'Prompt Inspiration',
        readMore: 'Read More',
        posts: {
          1: {
            title: 'The Ethics of AI: A Deep Dive',
            excerpt: 'Exploring the moral implications and responsibilities in AI development and deployment.',
          },
          2: {
            title: 'The Future of AI: What\'s Next?',
            excerpt: 'Predictions and insights into the evolving landscape of artificial intelligence.',
          },
          3: {
            title: 'AI in Education: Transforming Learning',
            excerpt: 'How artificial intelligence is revolutionizing the way we learn and teach.',
          },
        },
        prompts: {
          1: {
            title: 'Creative Writing',
            description: 'Generate unique story ideas and creative writing prompts.',
          },
          2: {
            title: 'Problem Solving',
            description: 'Get AI assistance in breaking down complex problems.',
          },
          3: {
            title: 'Research & Analysis',
            description: 'Deep dive into topics with AI-powered research tools.',
          },
        },
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 