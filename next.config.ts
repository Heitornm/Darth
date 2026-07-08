import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuração de Cabeçalhos de Segurança para o Render + Firebase Auth
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Libera o gapi e janelas do Firebase de forma segura
          },
        ],
      },
    ];
  },

  // 🚀 CORREÇÃO PARA O NEXT.JS 16:
  // Definimos a configuração nativa do Turbopack para mapear o Firebase corretamente
  turbopack: {
    resolveAlias: {
      'firebase/app': 'firebase/app',
      'firebase/auth': 'firebase/auth',
      'firebase/firestore': 'firebase/firestore',
    },
  },

  // Mantemos o fallback do Webpack apenas se o compilador precisar dele em algum ambiente,
  // mas o Next.js 16 priorizará o bloco turbopack acima sem estourar erros.
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