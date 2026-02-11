import TypewriterEffect from '@/components/ui/TypewriterEffect';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// No, I should check modules. I don't recall seeing this pkg. 
// I'll implement a simple View fallback or use SVG if standard expo packages allow.
// Safest: Simple text ring or just text for now to avoid install errors.

export default function TestResultScreen() {
    const { id, resultData } = useLocalSearchParams();
    const router = useRouter();
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (resultData) {
            try {
                const parsed = JSON.parse(resultData as string);
                setResult(parsed);
            } catch (e) {
                Alert.alert("Error", "Invalid result data");
                router.back();
            }
        }
    }, [resultData]);

    if (!result) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.replace('/(tabs)/(practice)')}>
                   <Ionicons name="close" size={24} color="#374151" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Evaluation Results</Text>
               <View style={{width: 24}} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Score Card */}
                <View style={styles.scoreCard}>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>{Math.round(result.percentage)}%</Text>
                        <Text style={styles.scoreLabel}>SCORE</Text>
                    </View>
                    <TypewriterEffect 
                        content={result.overall_feedback} 
                        style={{body: {color: '#D1D5DB', textAlign: 'center', fontSize: 14, lineHeight: 20}}}
                    />
                    
                    <View style={styles.tagContainer}>
                        {result.weak_concepts?.map((tag: string) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag.replace(/_/g, ' ')}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Detailed Analysis</Text>

                {result.question_feedback.map((feed: any, index: number) => (
                    <View key={feed.question_id} style={styles.feedCard}>
                        <View style={styles.feedHeader}>
                            <Ionicons 
                                name={feed.is_correct ? "checkmark-circle" : "close-circle"} 
                                size={24} 
                                color={feed.is_correct ? "#10B981" : "#EF4444"} 
                            />
                            <Text style={styles.feedIndex}>Question {index + 1}</Text>
                            <Text style={[styles.feedPoints, { marginLeft: 'auto' }]}>
                                {feed.points_earned}/{feed.points_possible} pts
                            </Text>
                        </View>
                        
                        <View style={styles.answerSection}>
                            <Text style={styles.label}>Your Answer:</Text>
                            <Text style={styles.value}>{feed.student_answer}</Text>
                        </View>

                        {!feed.is_correct && (
                             <View style={styles.answerSection}>
                                <Text style={[styles.label, {color: '#10B981'}]}>Correct Answer:</Text>
                                <Text style={styles.value}>{feed.correct_answer}</Text>
                             </View>
                        )}
                        
                        <View style={styles.feedbackBox}>
                             <Text style={styles.feedbackBody}>{feed.feedback}</Text>
                        </View>

                        {/* Rubric Breakdown for Subjective Questions */}
                        {feed.accuracy_score !== undefined && (
                            <View style={styles.rubricContainer}>
                                <View style={styles.rubricItem}>
                                    <Text style={styles.rubricLabel}>Accuracy</Text>
                                    <Text style={styles.rubricValue}>{feed.accuracy_score}/5</Text>
                                </View>
                                <View style={styles.rubricDivider} />
                                <View style={styles.rubricItem}>
                                    <Text style={styles.rubricLabel}>Clarity</Text>
                                    <Text style={styles.rubricValue}>{feed.clarity_score}/5</Text>
                                </View>
                                <View style={styles.rubricDivider} />
                                <View style={styles.rubricItem}>
                                    <Text style={styles.rubricLabel}>Explanation</Text>
                                    <Text style={styles.rubricValue}>{feed.explanation_score}/5</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                {/* Improvement Suggestions */}
                {result.improvement_suggestions && result.improvement_suggestions.length > 0 && (
                    <View style={styles.suggestionCard}>
                        <Text style={styles.suggestionTitle}>💡 Ways to Improve</Text>
                        {result.improvement_suggestions.map((sug: string, idx: number) => (
                            <View key={idx} style={styles.suggestionRow}>
                                <Ionicons name="arrow-forward-circle-outline" size={20} color="#4F46E5" />
                                <Text style={styles.suggestionText}>{sug}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => router.replace('/(tabs)/(practice)')}
                    >
                        <Text style={styles.actionBtnText}>Back to Hub</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    scoreCard: {
        backgroundColor: '#111827', // Dark card for contrast
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    scoreText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    scoreLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    feedbackText: {
        color: '#D1D5DB',
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 14,
        lineHeight: 20,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    tag: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red tint for weak concepts
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    tagText: {
        color: '#FCA5A5',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    feedCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    feedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    feedIndex: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    feedPoints: {
        fontSize: 12,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    answerSection: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        color: '#1F2937',
    },
    feedbackBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4F46E5',
    },
    feedbackBody: {
        fontSize: 13,
        color: '#4B5563',
        fontStyle: 'italic',
    },
    actionRow: {
        marginTop: 16,
    },
    actionBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#374151',
        fontWeight: '600',
    },
    rubricContainer: {
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    rubricItem: {
        alignItems: 'center',
    },
    rubricLabel: {
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 2,
    },
    rubricValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    rubricDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#D1D5DB',
    },
    suggestionCard: {
        marginTop: 24,
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: 12,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    suggestionText: {
        fontSize: 14,
        color: '#4338CA',
        flex: 1,
        lineHeight: 20,
    }
});
