/* eslint @typescript-eslint/no-var-requires: "off" */
const { i18n } = require('./next-i18next.config');
const { withSentryConfig } = require('@sentry/nextjs');

const os = require('os');
   
   function getServerIP() {
     const interfaces = os.networkInterfaces();
     // Busca la interfaz de red externa y devuelve su IP
     
     for (const name of Object.keys(interfaces)) {
       for (const iface of interfaces[name]) {
         if (iface.family === 'IPv4' && !iface.internal) {
           return iface.address;
         }
       }
     }
     return '0.0.0.0'; // fallback
   }
   
   // Usar en la configuración
   const serverIP = getServerIP();
   process.env.APP_URL = `http://${serverIP}:4002`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'boxyhq.com',
      },
      {
        protocol: 'https',
        hostname: 'files.stripe.com',
      },
    ],
  },
  i18n,
  typescript: {
    // !! AVISO !!
    // Peligrosamente permite que las compilaciones de producción se completen correctamente incluso si
    // tu proyecto tiene errores de tipo.
    // !! AVISO !!
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/.well-known/saml.cer',
        destination: '/api/well-known/saml.cer',
      },
      {
        source: '/.well-known/saml-configuration',
        destination: '/well-known/saml-configuration',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*?)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains;',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

// Additional config options for the Sentry webpack plugin.
// For all available options: https://github.com/getsentry/sentry-webpack-plugin#options.
const sentryWebpackPluginOptions = {
  silent: true,
  hideSourceMaps: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
