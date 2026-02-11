import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface AnswerCardProps {
    answer: string;
    videoTitle?: string;
    isLoading?: boolean;
}

export default function AnswerCard({ answer, videoTitle, isLoading }: AnswerCardProps) {
    if (!answer && !isLoading) return null;

    const formatContent = (text: string) => {
        if (!text) return '';
        let formatted = text.replace(/\\n/g, '\n\n');
        formatted = formatted.replace(/(?<!\n)\n(?!\n)/g, '  \n');
        return formatted;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="robot-outline" size={20} color="#4C51BF" />
                <Text style={styles.headerTitle}>AI Analysis</Text>
                {/* Source Trust Badge */}
                <View style={styles.trustBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={12} color="#059669" />
                    <Text style={styles.trustText}>Verified</Text>
                </View>
            </View>

            {isLoading ? (
                <Text style={styles.loadingText}>Generating answer...</Text>
            ) : (
                <Markdown style={markdownStyles}>
                    {formatContent(answer)}
                </Markdown>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    trustText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: '600',
        marginLeft: 4,
    },
    loadingText: {
        fontStyle: 'italic',
        color: '#666',
    },
});

const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#1f2937',
        lineHeight: 24,
    },
    heading1: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 8,
        color: '#111',
    },
    heading2: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 8,
        color: '#333',
    },
    paragraph: {
        marginBottom: 12,
    },
    strong: {
        fontWeight: '700' as const,
        color: '#000',
    },
    bullet_list: {
        marginBottom: 12,
    },
};
