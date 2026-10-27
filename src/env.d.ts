/// <reference types="astro/client" />

declare module '../../scripts/edition-order.mjs' {
  export function compareDaysDesc<T extends { date: string }>(a: T, b: T): number;
}

declare module '../../scripts/markdown.mjs' {
  export function renderMarkdown(source: string): string;
}

interface FeedLocalized {
  zh?: string;
  en?: string;
}

interface FeedStory {
  title: FeedLocalized;
  summary: FeedLocalized;
  sources: { name: string; url: string }[];
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  text: string;
  html: string;
}

declare module '../../scripts/feed.mjs' {
  export function xmlEscape(value: string): string;
  export function storyPubDate(date: string, part: string): string;
  export function renderStoryText(story: FeedStory): string;
  export function renderStoryHtml(story: FeedStory): string;
  export function renderRss(input: {
    title: string;
    link: string;
    selfUrl: string;
    description: string;
    language?: string;
    items: FeedItem[];
  }): string;
}
