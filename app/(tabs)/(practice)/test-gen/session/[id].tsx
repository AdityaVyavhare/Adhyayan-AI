import LoadingComponent from '@/components/ui/LoadingComponent';
import { ChatService } from '@/services/ChatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TestSessionScreen() {
    const { id, testData } = useLocalSearchParams();
    const router = useRouter();
    const test = React.useMemo(() => {
        if (!testData) return null;
        try {
            const parsed = JSON.parse(testData as string);
            // Ensure data integrity immediately
            if (!parsed || !Array.isArray(parsed.questions)) {
                console.log("TestSession: Invalid parsed data", parsed);
                return null;
            }
            return parsed;
        } catch (e) {
            console.log("TestSession: Parse error", e);
            Alert.alert("Error", "Invalid test data");
            router.back();
            return null;
        }
    }, [testData]);
    
    // const [test, setTest] = useState<any>(null); // Removed state
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Remove useEffect for setting test
    /*
    useEffect(() => {
        if (testData) { ... }
    }, [testData]);
    */

    const handleAnswer = (qId: string, value: string) => {
        setAnswers(prev => ({...prev, [qId]: value}));
    };

    const handleSubmit = async () => {
        // Validation: Ensure all questions answered? Or strictly allow partial?
        // Let's allow partial but warn.
        const unanswered = test.questions.length - Object.keys(answers).length;
        if (unanswered > 0) {
            // Simple confirm
            // For MVP, proceed.
        }

        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.keys(answers).map(qId => ({
                question_id: qId,
                answer: answers[qId]
            }));

            const result = await ChatService.evaluateTest(test.test_id, formattedAnswers);
            
            // Navigate to Result
            router.replace({
                pathname: '/(tabs)/(practice)/test-gen/result/[id]',
                params: { id: test.test_id, resultData: JSON.stringify(result) }
            });
        } catch (error) {
            Alert.alert("Submission Failed", "Please try again.");
            setIsSubmitting(false);
        }
    };

    if (!test || !Array.isArray(test.questions)) {
        console.log("TestSession: Loading or invalid data", test);
        return <LoadingComponent visible={true} text="Preparing your test..." />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{test.topic}</Text>
                    <Text style={styles.headerSubtitle}>{test.questions?.length || 0} Questions • {test.difficulty}</Text>
                </View>
                <View style={styles.timerBadge}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.timerText}>15 Mins</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {test.questions?.map((q: any, index: number) => (
                    <View key={q.question_id || index} style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionIndex}>{index + 1}.</Text>
                            <Text style={styles.questionText}>{q.question_text}</Text>
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>{q.points} pt</Text>
                            </View>
                        </View>

                        {q.question_type === 'mcq' && q.mcq_options ? (
                            <View style={styles.optionsList}>
                                {q.mcq_options.map((opt: any) => {
                                    const isSelected = answers[q.question_id] === opt.label;
                                    return (
                                        <TouchableOpacity 
                                            key={opt.label}
                                            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                                            onPress={() => handleAnswer(q.question_id, opt.label)}
                                        >
                                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                                {opt.option}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <TextInput
                                style={styles.textArea}
                                placeholder="Type your answer..."
                                multiline
                                numberOfLines={4}
                                value={answers[q.question_id] || ''}
                                onChangeText={(text) => handleAnswer(q.question_id, text)}
                                textAlignVertical="top"
                            />
                        )}
                    </View>
                ))}

                <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Test</Text>
                    )}
                </TouchableOpacity>

                {isSubmitting && <LoadingComponent visible={true} text="Evaluating..." />}
            </ScrollView>
        </SafeAreaView>
    );
}

// function LoadingScreen() { ... } // Removed
// Usage: if (!test ...) return <LoadingComponent visible={true} text="Preparing your test..." />

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light theme
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    timerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    questionHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    questionIndex: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        width: 24,
    },
    questionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        lineHeight: 24,
    },
    pointsBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        height: 24,
        alignSelf: 'flex-start',
        marginLeft: 8,
    },
    pointsText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '700',
    },
    optionsList: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    optionRowSelected: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#4F46E5',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4F46E5',
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
    },
    optionTextSelected: {
        color: '#4F46E5',
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        minHeight: 100,
    },
    submitBtn: {
        backgroundColor: '#111827', // Black primary button
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
