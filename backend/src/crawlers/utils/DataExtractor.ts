import * as cheerio from 'cheerio';

/**
 * Utility class for extracting data from various sources
 */
export class DataExtractor {
  /**
   * Extract value using CSS selector from Cheerio element
   */
  static extractWithSelector($: cheerio.CheerioAPI, element: any, selector: string): string | null {
    try {
      // Check if selector includes attribute extraction (e.g., "a@href")
      const attrMatch = selector.match(/^(.+)@(\w+)$/);

      if (attrMatch) {
        const [, cssSelector, attrName] = attrMatch;
        const $el = $(element).find(cssSelector).first();
        if ($el.length === 0) {
          $el.attr(attrName);
        }
        return $el.attr(attrName) || null;
      }

      // Regular CSS selector
      const $el = $(element).find(selector).first();
      if ($el.length === 0) {
        return $(element).is(selector) ? $(element).text().trim() : null;
      }

      return $el.text().trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract value using JSONPath from object
   */
  static extractWithJsonPath(obj: any, path: string): any {
    try {
      // Simple JSONPath implementation
      // Supports: $.field, $.field.nested, $.array[0], $.array[*]

      if (path === '$') {
        return obj;
      }

      // Remove leading $. or $
      const cleanPath = path.replace(/^\$\.?/, '');

      // Handle array wildcard [*]
      if (cleanPath.includes('[*]')) {
        const parts = cleanPath.split('[*]');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
          if (parts[i]) {
            current = this.navigatePath(current, parts[i]);
          }

          if (!Array.isArray(current)) {
            return null;
          }
        }

        return current;
      }

      return this.navigatePath(obj, cleanPath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Navigate through object path
   */
  private static navigatePath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (!part) continue;

      // Handle array index [0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current?.[key]?.[parseInt(index)];
      } else {
        current = current?.[part];
      }

      if (current === undefined || current === null) {
        return null;
      }
    }

    return current;
  }

  /**
   * Extract nested field from object
   */
  static extractNestedField(obj: any, fieldPath: string): any {
    if (!fieldPath) return null;

    // If it looks like JSONPath, use JSONPath extraction
    if (fieldPath.startsWith('$')) {
      return this.extractWithJsonPath(obj, fieldPath);
    }

    // Otherwise use simple dot notation
    return this.navigatePath(obj, fieldPath);
  }

  /**
   * Convert value to Date
   */
  static parseDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      // Unix timestamp (seconds or milliseconds)
      const timestamp = value > 10000000000 ? value : value * 1000;
      return new Date(timestamp);
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * Convert value to number
   */
  static parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Remove common number formatting (commas, spaces)
      const cleaned = value.replace(/[,\s]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }

    return null;
  }

  /**
   * Ensure URL is absolute
   */
  static normalizeUrl(url: string, baseUrl?: string): string {
    if (!url) return '';

    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Protocol-relative
    if (url.startsWith('//')) {
      return 'https:' + url;
    }

    // Relative URL
    if (baseUrl) {
      try {
        return new URL(url, baseUrl).href;
      } catch {
        return url;
      }
    }

    return url;
  }
}
