import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardDock from '../ui/KeyboardDock';

interface ScanPreviewViewProps {
    imageUri: string;
    onRetake: () => void;
    onSend: (text: string) => void;
    isLoading?: boolean;
}

export default function ScanPreviewView({ imageUri, onRetake, onSend, isLoading = false }: ScanPreviewViewProps) {
    const [inputText, setInputText] = useState('');

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onRetake} style={styles.backButton} disabled={isLoading}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Image</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            </View>

            <KeyboardDock>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Add a specific question (optional)..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, isLoading && styles.disabledSend]}
                        onPress={() => { onSend(inputText); }}
                        disabled={isLoading}
                    >
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardDock>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area approximation
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    inputWrapper: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 24,
        paddingHorizontal: 16,
        minHeight: 44,
        maxHeight: 100,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 8,
    },
    sendButton: {
        backgroundColor: '#111827',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disabledSend: {
        backgroundColor: '#e5e7eb',
    },
});
