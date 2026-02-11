import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface SectionsProps {
  links: string[];
  nextRelatedTopic: string[];
  nextQuestions: string[];
  onRelatedTopicPress?: (topic: string) => void;
  onFollowUpQuestionPress?: (question: string) => void;
}

const Sections: React.FC<SectionsProps> = ({
  links,
  nextRelatedTopic,
  nextQuestions,
  onRelatedTopicPress,
  onFollowUpQuestionPress,
}) => {
  return (
    <View style={styles.container}>
      {links && links.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          {links.map((link) => (
            <TouchableOpacity
              key={link}
              style={styles.linkButton}
              onPress={async () => {
                try {
                  await Linking.openURL(link);
                } catch {
                  // best-effort only
                }
              }}
            >
              <Text style={styles.linkText}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {nextRelatedTopic && nextRelatedTopic.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Topics</Text>
          <View style={styles.chipRow}>
            {nextRelatedTopic.map((topic) => (
              <TouchableOpacity
                key={topic}
                style={styles.topicChip}
                onPress={() => onRelatedTopicPress?.(topic)}
              >
                <Text style={styles.topicChipText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {nextQuestions && nextQuestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Questions</Text>
          <View style={styles.chipRow}>
            {nextQuestions.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.questionChip}
                onPress={() => onFollowUpQuestionPress?.(q)}
              >
                <Text style={styles.questionChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  topicChipText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },
  questionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  questionChipText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '500',
  },
});

export default Sections;

