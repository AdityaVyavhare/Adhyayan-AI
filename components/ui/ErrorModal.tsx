import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorModalProps {
    visible: boolean;
    error: string | null;
    onDismiss: () => void;
    onRetry?: () => void;
}

export default function ErrorModal({ visible, error, onDismiss, onRetry }: ErrorModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="alert-circle" size={32} color="#EF4444" />
                    </View>
                    <Text style={styles.title}>Error</Text>
                    <Text style={styles.message}>{error || "An unexpected error occurred."}</Text>
                    
                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                            <Text style={styles.dismissText}>Dismiss</Text>
                        </TouchableOpacity>
                        
                        {onRetry && (
                            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    dismissButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    dismissText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
    retryButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#4C51BF',
        alignItems: 'center',
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
