import { Helmet } from 'react-helmet-async';

interface SeoCardProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SeoCard({
  title = 'Deepthink AI – Deep Research Assistant',
  description = 'Deepthink AI lets you chat with open-source AI models like Gemma, Mistral, DeepSeek, and more. Fast, private, and free.',
  image = 'https://www.deepthinkai.app/images/logo.png',
  url = 'https://www.deepthinkai.app',
}: SeoCardProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
} 