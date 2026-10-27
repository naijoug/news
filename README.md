# 朝夕

每天两刊的中文新闻简报，发布在 GitHub Pages 上。栏目固定为四块：**科技与AI**、**国际与政治**、**商业与市场**、**中国**。每条只有标题、一两句摘要，和来源链接。

Zhaoxi is a static daily digest. A morning edition (早报) and an evening edition (晚报) are each **one JSON file**. Pushing that file to `main` validates it and deploys the site. Nobody needs a local build to publish.

**Site:** https://naijoug.github.io/news/

The production origin is set in `astro.config.mjs` (`site` and the default base `/news`). A custom domain would need that `site` value updated.

## One-time setup

The deploy workflow is `.github/workflows/pages.yml`. It uses the official Pages actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) and needs no secrets.

Before the first deploy, in the repository on GitHub:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. If Actions are turned off: **Settings → Actions → General → Actions permissions**, allow actions.

If the first run of “Deploy GitHub Pages” fails because Pages was not switched yet, re-run that workflow after step 1. A failed build does not replace the last successful deployment.

Pull requests run `.github/workflows/ci.yml` (test + build only). They are not deployed. A push to `main` is what publishes, including a file created with the GitHub contents API.

## Why Astro

The site is [Astro](https://astro.build/). It turns a handful of page types — latest edition, permalinks, archive, section indexes, RSS, sitemap — into static HTML and ships no client-side framework. Edition files stay plain JSON outside the app, so a writer adds a day by creating one file. The build runs only in GitHub Actions.

## Authoring spec（写作规范）

The JSON Schema `schemas/edition.schema.json` is normative. `schemas/edition.example.json` is a valid template. CI rejects a push when a file does not match this spec; the log names the file and the JSON pointer.

### Path

```
content/YYYY/MM/YYYY-MM-DD-morning.json
content/YYYY/MM/YYYY-MM-DD-evening.json
```

Examples:

```
content/2026/10/2026-10-27-morning.json    早报
content/2026/10/2026-10-27-evening.json    晚报
content/2026/09/2026-09-01-evening.json    晚报，月份必须是两位
```

Rules:

- `YYYY-MM-DD` in the filename, the directory, and the `date` field are the same real calendar date.
- The directory is `YYYY/MM` with a zero-padded month (`09`, not `9`).
- The filename suffix is `morning` (早报) or `evening` (晚报), and it matches `edition`.
- One edition per file. Two files can share a date only when one is `morning` and the other is `evening`.
- UTF-8 JSON, no BOM. Two-space indentation is recommended. Minified JSON is accepted.
- Do not put anything else under `content/`.

Creating the file on branch `main` is enough. The GitHub contents API path is that exact path (slashes included). No local `npm run build` is required.

### Document

```json
{
  "$schema": "../../../schemas/edition.schema.json",
  "date": "2026-10-27",
  "edition": "morning",
  "lead": "可选。一两句话介绍这一刊。没有导语就不要写这个字段。",
  "sections": {
    "tech": [
      {
        "title": "标题",
        "summary": "一两句话说明发生了什么，以及为什么值得打开原文。",
        "sources": [
          { "name": "来源名", "url": "https://example.com/story" }
        ]
      }
    ],
    "world": [],
    "business": [],
    "china": []
  }
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD`, a real calendar date, identical to the path |
| `edition` | yes | `morning` (早报) or `evening` (晚报). Not the Chinese word |
| `lead` | no | 1–200 characters. Omit the key when unused. Do not send `""` |
| `sample` | no | `true` only for placeholders. Omit or `false` for a real edition |
| `$schema` | no | Editor hint. Ignored by the site |
| `sections` | yes | Object with **exactly** these keys, in any order |

Section keys:

| Key | 栏目 |
| --- | --- |
| `tech` | 科技与AI |
| `world` | 国际与政治 |
| `business` | 商业与市场 |
| `china` | 中国 |

All four keys are required. Use `[]` when that section has no stories. The edition needs at least one story in total. At most 8 stories per section. The site prints sections in the order above, not the order of the keys.

Each story:

| Field | Rule |
| --- | --- |
| `title` | 2–100 characters |
| `summary` | One or two sentences, 8–280 characters |
| `sources` | 1–5 items. Each is `{ "name", "url" }` |

Each source:

| Field | Rule |
| --- | --- |
| `name` | 1–40 characters, the publication or page name |
| `url` | `https://` URL with a host name, max 2000 characters |

No other fields. Chinese names such as `"科技与AI"` or `"早报"` are not keys and not values of `edition`.

### Sample editions

`"sample": true` still builds and is labeled 示例刊 on the site. Sample editions are left out of the RSS feed and the sitemap, and the page is `noindex`. The two files under `content/2026/10/` are samples so the site builds; replace them, or add a later date, when real copy starts. Do not set `sample` on a real edition. While every edition is a sample, `robots.txt` disallows crawlers.

The homepage is the newest date. On that date, the evening edition is newer than the morning edition.

### What CI checks

`npm test` and the build both run `scripts/validate-content.mjs`. A bad file fails the job before deploy. The log looks like:

```
Edition content is invalid.

content/2026/10/2026-10-27-morning.json
  - /sections has unknown field "科技与AI" — use the key "tech"
  - filename date is 2026-10-27 but "date" is "2026-10-28"

See README.md (“Authoring spec”) and schemas/edition.schema.json.
```

## Routes

| Page | URL |
| --- | --- |
| Latest edition | https://naijoug.github.io/news/ |
| One edition | https://naijoug.github.io/news/editions/2026-10-27-morning/ |
| Archive | https://naijoug.github.io/news/archive/ |
| 科技与AI | https://naijoug.github.io/news/sections/tech/ |
| 国际与政治 | https://naijoug.github.io/news/sections/world/ |
| 商业与市场 | https://naijoug.github.io/news/sections/business/ |
| 中国 | https://naijoug.github.io/news/sections/china/ |
| RSS | https://naijoug.github.io/news/rss.xml |

RSS `pubDate` is a nominal time: 08:00 Asia/Shanghai for morning, 20:00 for evening. The feed includes real editions only.

## Local preview

Writers do not need this. To preview:

```bash
npm install
npm test
npm run dev
```

Open http://localhost:4321/news/ . The dev server defaults the base path to `/news/`, matching GitHub Pages for this repository. `npm run build` validates, typechecks, builds `dist/`, and smoke-tests it.

Node.js 22 or newer.
