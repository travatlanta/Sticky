import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://stickybanditos.com'

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/products/2x2-stickers`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/products/3x3-stickers`,
      lastModified: new Date(),
    },
  ]
}
