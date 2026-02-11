import { ContentPart, parseStrictContent } from '@/utils/strictContentParser';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import CodeBlockView from './CodeBlockView';
import FormulaView from './FormulaView';

interface TypewriterEffectProps {
    content: string;
    speed?: number; // ms per chunk
    onComplete?: () => void;
    style?: any;
}

const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 24,
    },
    strong: {
        fontWeight: 'bold',
        color: '#111827',
    },
    em: {
        fontStyle: 'italic',
    },
    link: {
        color: '#2563EB',
        textDecorationLine: 'underline',
    },
};

export default function TypewriterEffect({ content, speed = 8, onComplete, style }: TypewriterEffectProps) {
    const [displayedContent, setDisplayedContent] = useState('');
    const [parsedParts, setParsedParts] = useState<ContentPart[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Fade in when component mounts
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (!content) return;

        let currentIndex = 0;
        let animFrameId: number;
        let lastTime = 0;

        // Use word-boundary aware chunking for natural typing feel
        const getNextChunk = (idx: number): number => {
            // Stream 3-6 chars at a time, preferring word boundaries
            const minChunk = 3;
            const maxChunk = 6;
            const end = Math.min(idx + maxChunk, content.length);
            
            // Look for a word boundary within the range
            for (let i = idx + minChunk; i <= end; i++) {
                if (content[i] === ' ' || content[i] === '\n' || content[i] === ',' || content[i] === '.') {
                    return i + 1; // include the space/newline
                }
            }
            return end; // no boundary found, use max chunk
        };

        const tick = (timestamp: number) => {
            if (currentIndex >= content.length) {
                setIsComplete(true);
                onComplete?.();
                return;
            }

            if (timestamp - lastTime >= speed) {
                lastTime = timestamp;
                const nextIndex = getNextChunk(currentIndex);
                const newContent = content.slice(0, nextIndex);
                
                setDisplayedContent(newContent);
                setParsedParts(parseStrictContent(newContent));
                currentIndex = nextIndex;
            }

            animFrameId = requestAnimationFrame(tick);
        };

        animFrameId = requestAnimationFrame(tick);

        return () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
        };
    }, [content, speed]);

    // Show final state immediately if complete
    useEffect(() => {
        if (isComplete) {
            setParsedParts(parseStrictContent(content));
        }
    }, [isComplete, content]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {parsedParts.map((part, index) => {
                if (part.type === 'formula') {
                    return <FormulaView key={`f-${index}`} formula={part.content} style={style} />;
                } else if (part.type === 'code') {
                    return <CodeBlockView key={`c-${index}`} code={part.content} style={style} />;
                } else {
                    return (
                        <Markdown key={`t-${index}`} style={{...markdownStyles, ...style}}>
                            {part.content}
                        </Markdown>
                    );
                }
            })}
            {!isComplete && <View style={styles.cursor} />}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    cursor: {
        width: 2,
        height: 18,
        backgroundColor: '#0d9488',
        borderRadius: 1,
        marginLeft: 2,
        opacity: 0.8,
    },
});
