export interface ParsedContent {
  paragraphs: string[];
  codeBlocks: string[];
  formulas: string[];
}

export const parseBody = (body: string): ParsedContent => {
  if (!body) return { paragraphs: [], codeBlocks: [], formulas: [] };

  // Split by paragraph separator
  const paragraphs = body.split('*/,').map(p => p.trim());
  
  const parsed: ParsedContent = {
    paragraphs: [],
    codeBlocks: [],
    formulas: [],
  };
  
  paragraphs.forEach((para) => {
    // Extract code blocks
    const codeRegex = /\[\[CODE\]\](.*?)\[\[\/CODE\]\]/gs;
    const codeMatches = [...para.matchAll(codeRegex)];
    codeMatches.forEach(match => {
      parsed.codeBlocks.push(match[1].trim());
    });
    
    // Extract formulas
    const formulaRegex = /\[\[FORMULA\]\](.*?)\[\[\/FORMULA\]\]/gs;
    const formulaMatches = [...para.matchAll(formulaRegex)];
    formulaMatches.forEach(match => {
      parsed.formulas.push(match[1].trim());
    });
    
    // Remove markers and keep clean text
    // Replace blocks with placeholders if we want to interleave, but guide suggests just lists.
    // Ideally we should keep the structure related, but for now getting the content out is key.
    // The guide example creates separate lists.
    let cleanPara = para
      .replace(/\[\[CODE\]\].*?\[\[\/CODE\]\]/gs, ' [CODE BLOCK] ')
      .replace(/\[\[FORMULA\]\].*?\[\[\/FORMULA\]\]/gs, ' [FORMULA] ');
    
    if (cleanPara.trim()) {
        parsed.paragraphs.push(cleanPara.trim());
    }
  });
  
  return parsed;
};
