import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parseBody, ParsedParagraph } from '@/utils/bodyParser';
import ParagraphRenderer from '@/components/ParagraphRenderer';
import VideoSection from '@/components/VideoSection';
import Sections from '@/components/Sections';

export interface StructuredOutput {
  title: string;
  body: string;
  links: string[];
  Need_of_manim: 'YES' | 'No';
  manim_video_path: string;
  main_video_prompt: string;
  next_related_topic: string[];
  next_questions: string[];
}

export interface EducationalResponseProps {
  structuredOutput: StructuredOutput;
  onFollowUpQuestionPress?: (question: string) => void;
  onRelatedTopicPress?: (topic: string) => void;
}

const EducationalResponse: React.FC<EducationalResponseProps> = ({
  structuredOutput,
  onFollowUpQuestionPress,
  onRelatedTopicPress,
}) => {
  const paragraphs = useMemo<ParsedParagraph[]>(
    () => parseBody(structuredOutput.body),
    [structuredOutput.body],
  );

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{structuredOutput.title}</Text>
      <VideoSection
        needOfManim={structuredOutput.Need_of_manim}
        manimVideoPath={structuredOutput.manim_video_path}
        mainVideoPrompt={structuredOutput.main_video_prompt}
      />
    </View>
  );

  const Footer = () => (
    <Sections
      links={structuredOutput.links || []}
      nextRelatedTopic={structuredOutput.next_related_topic || []}
      nextQuestions={structuredOutput.next_questions || []}
      onRelatedTopicPress={onRelatedTopicPress}
      onFollowUpQuestionPress={onFollowUpQuestionPress}
    />
  );

  const renderItem = ({ item }: { item: ParsedParagraph }) => (
    <ParagraphRenderer paragraph={item} />
  );

  if (paragraphs.length > 20) {
    return (
      <FlatList
        data={paragraphs}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderItem}
        ListHeaderComponent={<Header />}
        ListFooterComponent={<Footer />}
        contentContainerStyle={styles.contentContainer}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <Header />
      {paragraphs.map((p, index) => (
        <ParagraphRenderer key={index} paragraph={p} />
      ))}
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
});

export default EducationalResponse;

