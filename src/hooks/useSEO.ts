import { useEffect, useMemo } from 'react';
import { applySEO, SEOConfig } from '../seo/seo';

export function useSEO(config: SEOConfig): void {
  const normalizedConfig = useMemo<SEOConfig>(
    () => ({
      title: config.title,
      description: config.description,
      path: config.path,
      image: config.image,
      type: config.type,
      robots: config.robots,
      keywords: config.keywords,
      structuredData: config.structuredData,
    }),
    [
      config.description,
      config.image,
      config.keywords,
      config.path,
      config.robots,
      config.structuredData,
      config.title,
      config.type,
    ],
  );

  useEffect(() => {
    applySEO(normalizedConfig);
  }, [normalizedConfig]);
}
