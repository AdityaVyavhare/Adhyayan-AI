import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface LoadingComponentProps {
    visible: boolean;
    text?: string;
}

export default function LoadingComponent({ visible, text = "Thinking..." }: LoadingComponentProps) {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            startSpin();
        } else {
            spinValue.setValue(0);
        }
    }, [visible]);

    const startSpin = () => {
        spinValue.setValue(0);
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="sync" size={32} color="#4C51BF" />
                </Animated.View>
                <Text style={styles.text}>{text}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    container: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    text: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
});
