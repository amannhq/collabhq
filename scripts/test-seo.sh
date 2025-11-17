#!/bin/bash

# SEO Validation Script
# Run this to test your SEO setup locally

echo "🔍 Collab SEO Validation"
echo "========================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Dev server not running. Start it with: bun run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test OG Image
echo "📸 Testing OG Image..."
OG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/opengraph-image)
if [ "$OG_STATUS" -eq 200 ]; then
    echo "✅ OG Image: http://localhost:3000/opengraph-image"
else
    echo "❌ OG Image failed (Status: $OG_STATUS)"
fi

# Test Sitemap
echo ""
echo "🗺️  Testing Sitemap..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sitemap.xml)
if [ "$SITEMAP_STATUS" -eq 200 ]; then
    echo "✅ Sitemap: http://localhost:3000/sitemap.xml"
else
    echo "❌ Sitemap failed (Status: $SITEMAP_STATUS)"
fi

# Test Robots
echo ""
echo "🤖 Testing Robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/robots.txt)
if [ "$ROBOTS_STATUS" -eq 200 ]; then
    echo "✅ Robots: http://localhost:3000/robots.txt"
else
    echo "❌ Robots failed (Status: $ROBOTS_STATUS)"
fi

# Check Environment Variable
echo ""
echo "🌐 Environment Variables..."
if grep -q "NEXT_PUBLIC_APP_URL" .env.local 2>/dev/null; then
    APP_URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d '=' -f2)
    echo "✅ NEXT_PUBLIC_APP_URL=$APP_URL"
else
    echo "⚠️  NEXT_PUBLIC_APP_URL not set in .env.local"
fi

# Check meta.png
echo ""
echo "🖼️  Static Assets..."
if [ -f "public/images/meta.png" ]; then
    SIZE=$(du -h public/images/meta.png | cut -f1)
    echo "✅ meta.png exists ($SIZE)"
else
    echo "❌ meta.png not found at public/images/meta.png"
fi

echo ""
echo "========================"
echo "📋 Next Steps:"
echo "1. Visit http://localhost:3000 in your browser"
echo "2. View page source (Ctrl+U / Cmd+U)"
echo "3. Search for 'og:image' to verify meta tags"
echo "4. Test with: https://www.opengraph.xyz/"
echo "5. Read: docs/SEO_SETUP.md for full guide"
echo ""
