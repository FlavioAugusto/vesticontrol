/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.googletagmanager.com https://www.google-analytics.com https://checkout.infinitepay.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://images.unsplash.com https://*.cloudfront.net https://picsum.photos",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://api.checkout.infinitepay.io https://viacep.com.br https://melhorenvio.com.br https://sandbox.melhorenvio.com.br",
      "frame-src 'self' https://www.google.com https://maps.google.com https://www.google.com.br https://*.google.com https://checkout.infinitepay.io",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,   // Não revela tecnologia
  compress: true,

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  // Rewrites para camuflar tecnologia
  async rewrites() {
    return [];
  },

  // Redirects — rotas obsoletas levam pras atuais
  async redirects() {
    return [
      { source: '/admin/configuracoes', destination: '/admin/config', permanent: true },
      { source: '/admin/configuracoes/:path*', destination: '/admin/config/:path*', permanent: true },
      { source: '/super-admin', destination: '/admin', permanent: true },
      { source: '/super-admin/:path*', destination: '/admin', permanent: true },
    ];
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    minimumCacheTTL: 3600,
  },
};

module.exports = nextConfig;
