# Render bandwidth reduction patch (2026-08-18)

This is a review-only patch. It does NOT modify `server.js` or the `main` branch.

## Problem found

Current `server.js` sends `Cache-Control: no-store, no-cache` for `/`, `index.html`, and every `.js`, `.jsx`, `.html` request. The QMES index loads many JS/JSX files, so repeat visits and refreshes download those files again from Render.

## Recommended replacement

Replace the current cache-control middleware plus `express.static(...)` with the following after review/testing:

```js
// Keep the HTML shell fresh so deployments are detected quickly.
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || /\.html$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

// Cache versioned/static assets in the browser. Most QMES asset URLs already
// contain ?v=... cache-busting versions, so a new version still downloads when deployed.
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (/\.(?:js|jsx|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  },
}));
```

## Why conservative 1-day caching first

A 1-day browser cache is intentionally conservative for the first rollout. After confirming deployments and QMES updates work correctly, `max-age` can be increased (for example 7 days) for versioned assets.

## Important

- Do not delete the existing `server.js`.
- Test this change on a separate branch/service before merging to production.
- This reduces repeated Render static-asset transfer. It does not by itself explain every possible source of a 20 GB/day spike.
- Separately inspect Render bandwidth metrics/logs for the largest/requested paths and unusual request counts.
- NAMO Talk currently loads up to 2,000 Supabase message rows with `select('*')`; pagination should be a separate optimization before heavy chat/file use.
