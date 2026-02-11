export type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string }
  | { type: 'formula'; content: string };

export type ParsedParagraph = {
  segments: Segment[];
};

export function parseBody(body: string): ParsedParagraph[] {
  if (!body) return [];

  const paragraphsRaw = body.split('*/*');
  const parsed: ParsedParagraph[] = [];

  for (const rawParagraph of paragraphsRaw) {
    const paragraph = rawParagraph.trim();
    if (!paragraph) {
      parsed.push({ segments: [] });
      continue;
    }

    const segments: Segment[] = [];
    let index = 0;

    const CODE_START = '[[CODE]]';
    const CODE_END_SLASH = '[[/CODE]]';
    const CODE_END_BACKSLASH = '[[\\CODE]]';
    const FORMULA_START = '[[FORMULA]]';
    const FORMULA_END_SLASH = '[[/FORMULA]]';
    const FORMULA_END_BACKSLASH = '[[\\FORMULA]]';

    const nextMarker = (from: number) => {
      const codePos = paragraph.indexOf(CODE_START, from);
      const formulaPos = paragraph.indexOf(FORMULA_START, from);

      let kind: 'code' | 'formula' | null = null;
      let pos = -1;

      if (codePos !== -1 && (formulaPos === -1 || codePos < formulaPos)) {
        kind = 'code';
        pos = codePos;
      } else if (formulaPos !== -1) {
        kind = 'formula';
        pos = formulaPos;
      }

      return { kind, pos };
    };

    while (index < paragraph.length) {
      const { kind, pos } = nextMarker(index);

      if (!kind || pos === -1) {
        const textContent = paragraph.slice(index);
        if (textContent) {
          segments.push({ type: 'text', content: textContent });
        }
        break;
      }

      if (pos > index) {
        const textContent = paragraph.slice(index, pos);
        if (textContent) {
          segments.push({ type: 'text', content: textContent });
        }
      }

      if (kind === 'code') {
        const startIndex = pos + CODE_START.length;
        let endIndex = paragraph.indexOf(CODE_END_SLASH, startIndex);
        if (endIndex === -1) {
          endIndex = paragraph.indexOf(CODE_END_BACKSLASH, startIndex);
        }

        if (endIndex === -1) {
          const remaining = paragraph.slice(pos);
          segments.push({ type: 'text', content: remaining });
          break;
        }

        let codeContent = paragraph.slice(startIndex, endIndex);
        codeContent = codeContent.replace(/\\n/g, '\n');

        segments.push({ type: 'code', content: codeContent });
        const closingLen = paragraph.startsWith(CODE_END_SLASH, endIndex)
          ? CODE_END_SLASH.length
          : CODE_END_BACKSLASH.length;
        index = endIndex + closingLen;
      } else {
        const startIndex = pos + FORMULA_START.length;
        let endIndex = paragraph.indexOf(FORMULA_END_SLASH, startIndex);
        if (endIndex === -1) {
          endIndex = paragraph.indexOf(FORMULA_END_BACKSLASH, startIndex);
        }

        if (endIndex === -1) {
          const remaining = paragraph.slice(pos);
          segments.push({ type: 'text', content: remaining });
          break;
        }

        let formulaContent = paragraph.slice(startIndex, endIndex);
        formulaContent = formulaContent.replace(/\\\\/g, '\\');

        segments.push({ type: 'formula', content: formulaContent });
        const closingLen = paragraph.startsWith(FORMULA_END_SLASH, endIndex)
          ? FORMULA_END_SLASH.length
          : FORMULA_END_BACKSLASH.length;
        index = endIndex + closingLen;
      }
    }

    parsed.push({ segments });
  }

  return parsed;
}

