# SEO Setup Guide - Collab Platform

## ✅ What We've Implemented

### 1. **Metadata API (app/layout.tsx)**
- Complete Open Graph tags for social media sharing
- Twitter Card metadata with `summary_large_image`
- Full URLs for OG images (required for social platforms)
- Keywords, description, and title templates
- Robots meta tags for proper indexing

### 2. **Dynamic OG Image (app/opengraph-image.tsx)**
- Edge runtime for fast generation
- 1200x630px (recommended size)
- Uses your brand colors (#f3f1ea beige, #000 black)
- Automatically served at `/opengraph-image`

### 3. **Sitemap (app/sitemap.ts)**
- Dynamic sitemap generation
- Priority levels for pages
- Change frequency hints for crawlers
- Auto-served at `/sitemap.xml`

### 4. **Robots.txt (app/robots.ts)**
- Proper crawl rules
- API routes protected
- GPTBot allowed for AI indexing
- Links to sitemap

## 🔧 Required Environment Variables

Add to your `.env.local`:

```bash
# Production URL (CRITICAL for OG images to work)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Production
```

**Why this matters:** Social media platforms (LinkedIn, Twitter, Facebook) require **absolute URLs** for OG images. Without this, they can't fetch your preview image.

## 📋 Testing Checklist

### Local Testing
1. **Start dev server:**
   ```bash
   bun run dev
   ```

2. **Check OG Image:**
   - Visit: `http://localhost:3000/opengraph-image`
   - Should see your branded 1200x630 image

3. **Check Sitemap:**
   - Visit: `http://localhost:3000/sitemap.xml`
   - Should see XML with your routes

4. **Check Robots:**
   - Visit: `http://localhost:3000/robots.txt`
   - Should see crawl rules

### Social Media Validation

#### LinkedIn Post Inspector
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Check preview shows your OG image

#### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Verify card displays correctly

#### Facebook Sharing Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again" to refresh cache
4. Verify preview

#### Open Graph Checker
1. Go to: https://www.opengraph.xyz/
2. Enter your URL
3. See all meta tags

## 🚀 Production Deployment

### Before Deploying:

1. **Update Environment Variable:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Verify Image Size:**
   - OG image at `/public/images/meta.png` should be 1200x630px
   - File size < 5MB (Twitter limit)

3. **Update Twitter Handle:**
   - In `app/layout.tsx`, change `@collab` to your actual handle

### After Deployment:

1. **Clear Social Media Caches:**
   - LinkedIn: Use Post Inspector
   - Facebook: Use Sharing Debugger → "Scrape Again"
   - Twitter: First share might not show preview, second will

2. **Submit Sitemap to Search Engines:**
   - Google Search Console: https://search.google.com/search-console
   - Bing Webmaster Tools: https://www.bing.com/webmasters

## 🎨 Customizing OG Images

### Option 1: Use Static Image (Current)
Keep `/public/images/meta.png` - works everywhere

### Option 2: Dynamic Generation (Implemented)
Edit `app/opengraph-image.tsx` to:
- Change colors
- Add logo images
- Update text
- Add gradients

### Option 3: Page-Specific OG Images
Create in any route folder:
```typescript
// app/[org]/opengraph-image.tsx
export default async function Image({ params }) {
  return new ImageResponse(
    // Custom design for org pages
  );
}
```

## 📊 SEO Best Practices Implemented

✅ **Metadata API** - Type-safe, hierarchical metadata
✅ **Open Graph** - Full social media preview support
✅ **Twitter Cards** - Optimized for X/Twitter sharing
✅ **Sitemap** - Dynamic, auto-updating
✅ **Robots.txt** - Proper crawl rules
✅ **Semantic HTML** - Clean structure
✅ **Mobile-First** - Responsive design
✅ **Fast Loading** - Next.js optimization
✅ **HTTPS** - Secure (in production)
✅ **Canonical URLs** - Via metadataBase

## 🐛 Troubleshooting

### OG Image Not Showing
1. **Check URL is absolute:**
   ```typescript
   // ❌ Wrong
   images: ["/images/meta.png"]
   
   // ✅ Correct
   images: ["https://yourdomain.com/images/meta.png"]
   ```

2. **Verify file exists:**
   ```bash
   ls public/images/meta.png
   ```

3. **Check image dimensions:**
   - Recommended: 1200x630px
   - Min: 600x315px
   - Aspect ratio: 1.91:1

4. **Clear cache on social platforms** (see above)

### Sitemap Not Updating
- Sitemaps are generated at build time
- Redeploy to update
- Or use `revalidate` in sitemap.ts

### Meta Tags Not Visible
1. **View page source** (Ctrl+U / Cmd+U)
2. **Look for `<head>` tags**
3. **Should see:**
   ```html
   <meta property="og:image" content="https://..." />
   <meta name="twitter:card" content="summary_large_image" />
   ```

## 📚 Additional Resources

- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/) - For structured data

## 🔮 Next Steps

1. **Add JSON-LD Structured Data** for rich snippets
2. **Implement page-specific metadata** for dynamic routes
3. **Add analytics** (Google Analytics, Plausible)
4. **Monitor Core Web Vitals**
5. **Set up Google Search Console**
6. **Create blog posts** for content marketing
