export type ContentType = 'text' | 'formula' | 'code';

export interface ContentPart {
    type: ContentType;
    content: string;
}

/**
 * Parses strict content format where formulas and code blocks are enclosed in specific tags.
 * Everything else is treated as plain text, where markdown auto-detection characters are escaped.
 * @param text The input text to parse.
 * @returns Array of ContentPart objects.
 */
export function parseStrictContent(text: string): ContentPart[] {
    if (!text) return [];

    const parts: ContentPart[] = [];
    let currentIndex = 0;

    // Regex to match [[FORMULA]]...[[\FORMULA]] or [[CODE]]...[[\CODE]]
    // Also supports [[/FORMULA]] and [[/CODE]] (forward slash) which some models might output.
    const regex = /\[\[(FORMULA|CODE)\]\]([\s\S]*?)\[\[[\\/]\1\]\]/g;
    
    let match;

    while ((match = regex.exec(text)) !== null) {
        // 1. Handle text before the match
        if (match.index > currentIndex) {
            const textContent = text.substring(currentIndex, match.index);
            parts.push({
                type: 'text',
                content: escapeMarkdownAutoDetection(textContent)
            });
        }

        // 2. Handle the match (Formula or Code)
        const type = match[1] === 'FORMULA' ? 'formula' : 'code';
        const content = match[2]; // The content inside the tags
        
        parts.push({
            type,
            content
        });

        currentIndex = regex.lastIndex;
    }

    // 3. Handle remaining text
    if (currentIndex < text.length) {
        const remainingText = text.substring(currentIndex);
        parts.push({
            type: 'text',
            content: escapeMarkdownAutoDetection(remainingText)
        });
    }

    return parts;
}

/**
 * Escapes characters that might trigger unwanted markdown rendering (like math or code blocks).
 * Bold/Italic/Newlines are preserved as they are allowed.
 */
function escapeMarkdownAutoDetection(text: string): string {
    // Escape backticks to prevent code block auto-detection
    // Escape dollar signs to prevent math auto-detection
    // We do NOT escape *, _, ~, etc. to allow bold, italic, strikethrough.
    return text
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        // Also escape backslashes that might be trying to escape our escapes? 
        // No, that gets recursive. Just focus on triggers.
        // Maybe escape square brackets if they look like our tags? 
        // No, strict parser handles our tags first.
        ;
}
