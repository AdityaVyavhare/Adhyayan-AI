import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ThinkingBubbleProps {
    text?: string;
}

export default function ThinkingBubble({ text = "Thinking..." }: ThinkingBubbleProps) {
    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.text}>{text}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        marginVertical: 8,
        marginLeft: 0, // Align left
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White Card
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    text: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6B7280', // Gray text
        fontWeight: '500',
    },
});
