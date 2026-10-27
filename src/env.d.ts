/// <reference types="astro/client" />

declare module '../../scripts/edition-order.mjs' {
  export function compareEditionsDesc<T extends { date: string; edition: string }>(a: T, b: T): number;
}

interface FeedSection {
  name: string;
  stories: {
    title: string;
    summary: string;
    sources: { name: string; url: string }[];
  }[];
}

interface FeedEdition {
  lead?: string;
  sections: FeedSection[];
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
  export function editionPubDate(date: string, edition: string): string;
  export function renderEditionText(edition: FeedEdition): string;
  export function renderEditionHtml(edition: FeedEdition): string;
  export function renderRss(input: {
    title: string;
    link: string;
    selfUrl: string;
    description: string;
    language?: string;
    items: FeedItem[];
  }): string;
}
