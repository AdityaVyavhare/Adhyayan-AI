import React from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface CodeBlockViewProps {
    code: string;
    language?: string; // Optional if we want to parse language from tag like [[CODE:python]] later
    style?: any;
}

const CodeBlockView: React.FC<CodeBlockViewProps> = ({ code, style }) => {
    // Wrap code in markdown code block ticks for the renderer
    const markdownContent = "```\n" + code + "\n```";

    return (
        <View style={[styles.container, style]}>
            <Markdown style={markdownStyles}>
                {markdownContent}
            </Markdown>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    }
});

const markdownStyles = {
    code_block: {
        backgroundColor: '#1F2937', 
        borderRadius: 8,
        padding: 12,
        marginVertical: 4,
        fontSize: 13,
        fontFamily: 'monospace',
        color: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#374151',
    },
    fence: {
        backgroundColor: '#1F2937',
        borderRadius: 8,
        padding: 12,
        marginVertical: 4,
        fontSize: 13,
        fontFamily: 'monospace',
        color: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#374151',
    }
};

export default CodeBlockView;
