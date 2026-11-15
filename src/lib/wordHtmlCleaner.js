/**
 * Advanced HTML Sanitizer & Normalizer for Microsoft Word, Google Docs, and Rich Text
 * Strips Microsoft Word MsoNormal junk, XML tags, invalid attributes, while preserving
 * semantic formatting (headings, lists, bold, italic, underline, tables, links, quotes).
 */

export function cleanWordAndRichTextHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let cleaned = html;

  // 1. Remove Word conditional comments (e.g. <!--[if gte mso 9]>...<![endif]-->)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');

  // 2. Remove <style> and <meta> tags often pasted from Word/Outlook
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<meta[\s\S]*?>/gi, '');
  cleaned = cleaned.replace(/<link[\s\S]*?>/gi, '');

  // 3. Remove Office XML tags like <o:p></o:p>, <w:WordDocument> etc.
  cleaned = cleaned.replace(/<\/?\w+:[^>]*>/gi, '');

  // 4. Remove span tags with only font-family or mso styling if they don't add semantic value
  cleaned = cleaned.replace(/<span[^>]*style="[^"]*mso-[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // 5. Convert <b> and <i> to semantic <strong> and <em> if preferred
  cleaned = cleaned.replace(/<b(\s+[^>]*)?>/gi, '<strong>').replace(/<\/b>/gi, '</strong>');
  cleaned = cleaned.replace(/<i(\s+[^>]*)?>/gi, '<em>').replace(/<\/i>/gi, '</em>');

  // 6. Clean attributes on standard tags: strip class="MsoNormal", lang="EN-US", etc.
  cleaned = cleaned.replace(/\sclass="Mso[a-zA-Z0-9_-]+"/gi, '');
  cleaned = cleaned.replace(/\slang="[a-zA-Z0-9_-]+"/gi, '');
  cleaned = cleaned.replace(/\salign="[a-zA-Z0-9_-]+"/gi, '');

  // 7. Clean style attributes: remove mso-*, line-height: normal, font-family: Calibri, Arial, etc.
  cleaned = cleaned.replace(/style="([^"]*)"/gi, (match, styleContent) => {
    // Retain only safe CSS declarations: font-weight, font-style, text-decoration, color, background-color, text-align
    const rules = styleContent.split(';').map(r => r.trim()).filter(Boolean);
    const safeRules = rules.filter(r => {
      const lower = r.toLowerCase();
      if (lower.startsWith('mso-') || lower.startsWith('font-family') || lower.startsWith('tab-stops')) {
        return false;
      }
      return (
        lower.startsWith('color:') ||
        lower.startsWith('background-color:') ||
        lower.startsWith('text-align:') ||
        lower.startsWith('font-weight:') ||
        lower.startsWith('font-style:') ||
        lower.startsWith('text-decoration:')
      );
    });

    return safeRules.length > 0 ? `style="${safeRules.join('; ')}"` : '';
  });

  // 8. Clean up empty spans or font tags
  cleaned = cleaned.replace(/<span>(.*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');

  // 9. Consolidate consecutive line breaks or empty paragraphs
  cleaned = cleaned.replace(/<p>(&nbsp;|\s)*<\/p>/gi, '');
  cleaned = cleaned.replace(/<div>(&nbsp;|\s)*<\/div>/gi, '');

  // 10. Trim whitespace
  return cleaned.trim();
}

/**
 * Extracts plain text from HTML
 */
export function stripHtmlToText(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Calculates estimated reading time and word count
 */
export function calculateTextStats(html) {
  const text = stripHtmlToText(html);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200)); // average reading speed ~200 wpm

  return {
    words,
    chars,
    readingTime: `${minutes} min read`
  };
}
