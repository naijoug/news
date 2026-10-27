import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from './markdown.mjs';

test('markdown escapes html and keeps a small safe subset', () => {
  const html = renderMarkdown(
    'Hello <script>alert(1)</script> & friends.\n\nSee the [source](https://example.com/a?x=1&y=2).\n\n- **Bold** item\n- *em* item',
  );
  assert.match(html, /Hello &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; friends\./);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /<a href="https:\/\/example\.com\/a\?x=1&amp;y=2">source<\/a>/);
  assert.match(html, /<li><strong>Bold<\/strong> item<\/li>/);
  assert.match(html, /<li><em>em<\/em> item<\/li>/);
  assert.doesNotMatch(renderMarkdown('[x](javascript:alert(1))'), /<a href="javascript:/);
});
