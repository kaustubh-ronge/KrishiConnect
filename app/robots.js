export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/how-it-works'],
      disallow: [
        '/api/',
        '/_next/',
        '/static/',
        '/admin-dashboard/',
        '/agent-dashboard/',
        '/farmer-dashboard/',
        '/delivery-dashboard/',
        '/marketplace/',
        '/cart/',
        '/my-orders/',
        '/onboarding/',
        '/sign-in/',
        '/sign-up/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
