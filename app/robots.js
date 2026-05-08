export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/how-it-works'],
      disallow: [
        '/admin-dashboard/',
        '/agent-dashboard/',
        '/farmer-dashboard/',
        '/delivery-dashboard/',
        '/marketplace/', // Since marketplace requires login, don't waste crawl budget
        '/cart/',
        '/my-orders/',
        '/onboarding/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
