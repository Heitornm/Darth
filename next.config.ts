import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // No Next.js 16+, se quiser ignorar o ESLint no build, a chave correta mudou para dentro de experimental ou removida.
  // Como você já usa TypeScript ignorando erros, podemos simplesmente omitir o bloco eslint antigo que gerava o Warning.

  // Configuração para o Turbopack (Novo padrão do Next 16)
  experimental: {
    turbo: {
      resolveAlias: {
        'firebase/app': 'firebase/app',
        'firebase/auth': 'firebase/auth',
        'firebase/firestore': 'firebase/firestore',
      },
    },
  },

  // Mantemos o fallback do Webpack caso você precise rodar sem o Turbopack em algum ambiente
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app': require.resolve('firebase/app'),
      'firebase/auth': require.resolve('firebase/auth'),
      'firebase/firestore': require.resolve('firebase/firestore'),
    };
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;