import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ParsedParagraph, Segment } from '@/utils/bodyParser';
import CodeBlock from '@/components/CodeBlock';
import FormulaBlock from '@/components/FormulaBlock';

export interface ParagraphRendererProps {
  paragraph: ParsedParagraph;
}

const ParagraphRenderer: React.FC<ParagraphRendererProps> = ({ paragraph }) => {
  if (!paragraph.segments.length) return null;

  const renderSegment = (segment: Segment, index: number) => {
    switch (segment.type) {
      case 'code':
        return <CodeBlock key={index} code={segment.content} />;
      case 'formula':
        return <FormulaBlock key={index} formula={segment.content} />;
      case 'text':
      default:
        if (!segment.content.trim()) return null;
        return (
          <Text key={index} style={styles.text}>
            {segment.content}
          </Text>
        );
    }
  };

  return <View style={styles.paragraph}>{paragraph.segments.map(renderSegment)}</View>;
};

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
});

export default ParagraphRenderer;

