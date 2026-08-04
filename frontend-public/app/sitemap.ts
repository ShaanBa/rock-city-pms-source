import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = siteConfig.siteUrl

    const routes = ['', '/amenities', '/book', '/contact', '/rooms', '/location']

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8
    }))
}