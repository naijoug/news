# 朝夕

每天一刊的新闻简报，中英都能读，发布在 GitHub Pages 上。栏目固定为四块：**科技与AI**、**国际与政治**、**商业与市场**、**中国**。上午和下午写在**同一个** JSON 文件里。

Zhaoxi is a static daily digest. Each calendar day is **one JSON file**. Morning stories go in `am`. Afternoon stories, when they exist, go in `pm` on that same file. Pushing the file to `main` validates it and deploys the site. Nobody needs a local build to publish.

**Site:** https://naijoug.github.io/news/

The production origin is set in `astro.config.mjs` (`site` and the default base `/news`). A custom domain would need that `site` value updated.

## One-time setup

The deploy workflow is `.github/workflows/pages.yml`. It uses the official Pages actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) and needs no secrets.

Before the first deploy, in the repository on GitHub:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. If Actions are turned off: **Settings → Actions → General → Actions permissions**, allow actions.

If the first run of “Deploy GitHub Pages” fails because Pages was not switched yet, re-run that workflow after step 1. A failed build does not replace the last successful deployment.

Pull requests run `.github/workflows/ci.yml` (test + build only). They are not deployed. A push to `main` is what publishes, including a file created with the GitHub contents API.

If Pages is already set to GitHub Actions, publishing a new day does not need another setting.

## Why Astro

The site is [Astro](https://astro.build/). It turns a handful of page types — the latest day, day archives, story pages, section indexes, RSS, sitemap — into static HTML and ships no client-side framework. Day files stay plain JSON outside the app, so a writer adds a day by creating one file, or appends the afternoon by editing that file. The build runs only in GitHub Actions.

Latin text uses self-hosted Fira Code. Chinese text uses the existing system font stack. There is no separate i18n framework: the page renders both languages, and a small script plus CSS chooses which one is visible.

## Reading the site

The UI language (中文 / EN, the `EN` button in the header) and the story text (原文 / 翻译) are separate.

- UI language is stored in `localStorage` as `ui-lang` (`zh` or `en`). Default is Chinese.
- Story text is stored as `text-mode`: `auto` (follow the UI language), `original`, or `translation`.
- In `auto`, a Chinese UI shows Chinese when that text exists. An English original then shows the translation and the translation icon. Switching the toggle to 原文 shows the English and the original icon.
- A Chinese original does the reverse when the UI is English.
- If a story has only one language, the translation control is hidden.

## Authoring spec（写作规范）

The JSON Schema `schemas/edition.schema.json` is normative. `schemas/edition.example.json` is a valid template. CI rejects a push when a file does not match this spec; the log names the file and the JSON pointer.

### Path

```
content/YYYY/MM/YYYY-MM-DD.json
```

Examples:

```
content/2026/10/2026-10-27.json
content/2026/09/2026-09-01.json    月份必须是两位
```

Rules:

- One file per calendar day. Do not create `YYYY-MM-DD-morning.json`, `YYYY-MM-DD-evening.json`, or any second file for the same date.
- `YYYY-MM-DD` in the filename, the directory, and the `date` field are the same real calendar date.
- The directory is `YYYY/MM` with a zero-padded month (`09`, not `9`).
- UTF-8 JSON, no BOM. Two-space indentation is recommended. Minified JSON is accepted.
- Do not put anything else under `content/`.

Creating or updating that file on branch `main` is enough. The GitHub contents API path is that exact path (slashes included). No local `npm run build` is required.

From a file in `content/YYYY/MM/`, the schema pointer is `../../../schemas/edition.schema.json`.

### Document

```json
{
  "$schema": "../../../schemas/edition.schema.json",
  "date": "2026-10-27",
  "lead": {
    "zh": "可选。没有导语就不要写 lead。",
    "en": "Optional. Omit lead when there is no introduction."
  },
  "am": {
    "tech": [
      {
        "id": "model-eval",
        "originalLang": "en",
        "title": { "zh": "中文标题", "en": "English title" },
        "summary": {
          "zh": "一两句中文摘要，说明发生了什么。",
          "en": "One or two English sentences on what happened."
        },
        "body": {
          "en": "Optional Markdown. Paragraphs, lists, and https links.\n\n- A point.\n- The [source](https://example.com/story)."
        },
        "sources": [
          { "name": "Example Desk", "url": "https://example.com/story", "lang": "en" }
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
| `am` | yes | Morning block. Object with **exactly** `tech`, `world`, `business`, `china` |
| `pm` | no | Afternoon block, same shape as `am`. Omit the key until afternoon stories exist |
| `lead` | no | `{ "zh"?, "en"? }`, each 1–200 characters. Omit the key when unused |
| `sample` | no | `true` only for placeholders. Omit or `false` for a real day |
| `$schema` | no | Editor hint. Ignored by the site |

Do not use `edition`, `sections`, `morning`, or `evening`. Those were the old two-file model.

Section keys:

| Key | 栏目 | English |
| --- | --- | --- |
| `tech` | 科技与AI | Tech and AI |
| `world` | 国际与政治 | World and politics |
| `business` | 商业与市场 | Business and markets |
| `china` | 中国 | China |

All four keys are required inside `am`, and inside `pm` when `pm` is present. Use `[]` when that section has no stories. The file needs at least one story in total. `pm`, if present, needs at least one story of its own. At most 8 stories per section. The site prints morning, then afternoon, and sections in the order above.

### Adding the afternoon later

Ship the morning alone: write `am` and omit `pm`.

When afternoon stories are ready, edit **this same file**. Add a `pm` object with all four section keys and the new stories. Do not create another file. Do not rename existing `id`s — they are the story URLs.

An agent appending the afternoon should:

1. Open `content/YYYY/MM/YYYY-MM-DD.json` for that calendar day.
2. If the file does not exist, create it with `date`, `am`, and the four section keys.
3. If it exists, leave `am` and every existing story `id` untouched.
4. Set `pm` to `{ "tech": [], "world": [], "business": [], "china": [] }` and put the afternoon stories in the right arrays.
5. Keep every story `id` unique inside the file.

### Story fields

| Field | Rule |
| --- | --- |
| `id` | 2–60 characters. Lowercase letters, digits, and hyphens (`model-eval`). Unique in the day. Stable URL slug |
| `originalLang` | `zh` or `en`. The language the story was written in. Required |
| `title` | `{ "zh"?, "en"? }`. The original language is required. 2–100 characters |
| `summary` | Same languages as `title`, 8–280 characters. A translation must include both title and summary |
| `body` | Optional. Same shape, up to 6000 characters per language. Markdown, not raw HTML |
| `sources` | 1–5 items |

`body` may be omitted for a short item. The detail page then shows the summary and the sources. A language used in `body` must also have `title` and `summary` in that language.

Markdown allowed in `body`: paragraphs (blank line), `- ` lists, `**bold**`, `*emphasis*`, and `[label](https://...)`. Anything else is shown as text. Raw HTML is escaped.

Each source:

| Field | Rule |
| --- | --- |
| `name` | 1–80 characters, the publication or page name |
| `url` | `https://` URL with a host name, max 2000 characters |
| `lang` | Optional `zh` or `en`, the language of that source page |

No other fields. Chinese names such as `"科技与AI"` are not keys.

### Sample days

`"sample": true` still builds and is labeled 示例 / Sample. Sample days are left out of the RSS feed and the sitemap, and their pages are `noindex`. The files under `content/2026/10/` are samples so the site builds; replace them, or add a later date, when real copy starts. Do not set `sample` on a real day. While every day is a sample, `robots.txt` disallows crawlers.

The homepage lists dates, newest first, with up to eight headlines and a count of the rest. Open a date for that day's page: morning is above afternoon.

### What CI checks

`npm test` and the build both run `scripts/validate-content.mjs`. A bad file fails the job before deploy. The log looks like:

```
Edition content is invalid.

content/2026/10/2026-10-27.json
  - /am has unknown field "科技与AI" — use the key "tech"
  - filename date is 2026-10-27 but "date" is "2026-10-28"

See README.md (“Authoring spec”) and schemas/edition.schema.json.
```

## Routes

| Page | URL |
| --- | --- |
| Latest day | https://naijoug.github.io/news/ |
| One day | https://naijoug.github.io/news/days/2026-10-27/ |
| One story | https://naijoug.github.io/news/stories/2026-10-27/model-eval/ |
| Archive | https://naijoug.github.io/news/archive/ |
| 科技与AI | https://naijoug.github.io/news/sections/tech/ |
| 国际与政治 | https://naijoug.github.io/news/sections/world/ |
| 商业与市场 | https://naijoug.github.io/news/sections/business/ |
| 中国 | https://naijoug.github.io/news/sections/china/ |
| RSS | https://naijoug.github.io/news/rss.xml |

RSS items are individual non-sample stories. `pubDate` is a nominal time: 08:00 Asia/Shanghai for `am`, 16:00 for `pm`. The feed prefers the Chinese title when it exists.

## Local preview

Writers do not need this. To preview:

```bash
npm install
npm test
npm run dev
```

Open http://localhost:4321/news/ . The dev server defaults the base path to `/news/`, matching GitHub Pages for this repository. `npm run build` validates, typechecks, builds `dist/`, and smoke-tests it.

Node.js 22.23.4 or newer. CI installs 22.23.4, which is the minimum Astro accepts.
