export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  // Public routes defined in proxy.js
  const routes = [
    '',
    '/about',
    '/how-it-works',
    '/sign-in',
    '/sign-up'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes];
}
