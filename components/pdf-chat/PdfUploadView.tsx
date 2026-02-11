import ToolHeader from '@/components/ui/ToolHeader';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PdfUploadViewProps {
    onPickDocument: () => void;
    onUrlSubmit: (url: string) => void;
    recentDocuments?: Array<{ id: string; name: string; date: string; size: string }>;
    onClose?: () => void; // For the "X" in top left
    onOpenHistory?: () => void; // New prop for history
}

export default function PdfUploadView({ onPickDocument, onUrlSubmit, recentDocuments = [], onClose, onOpenHistory }: PdfUploadViewProps) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <ToolHeader 
                title="PDF Chat" 
                onClose={onClose || (() => {})} 
                onHistory={onOpenHistory || (() => {})} 
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                         <Ionicons name="document-text" size={32} color="#4C51BF" />
                    </View>
                    <Text style={styles.heroTitle}>Chat with any PDF</Text>
                    <Text style={styles.heroSubtitle}>
                        Upload a document to get summaries, step-by-step explanations, and answers.
                    </Text>
                </View>

                {/* Upload Section */}
                <View style={styles.uploadCard}>
                    <Ionicons name="cloud-upload-outline" size={48} color="#999" style={{marginBottom: 16}} />
                    
                    <TouchableOpacity style={styles.browseButton} onPress={onPickDocument}>
                        <Ionicons name="folder-open-outline" size={20} color="#fff" style={{marginRight: 8}} />
                        <Text style={styles.browseButtonText}>Browse Files</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.limitText}>PDF, DOCX up to 20MB</Text>
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* URL Input */}
                <View style={styles.urlInputContainer}>
                    <TextInput 
                        style={styles.urlInput}
                        placeholder="Paste document URL..."
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.urlGoButton}>
                        <Ionicons name="arrow-forward" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Recent Documents */}
                <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent Documents</Text>
                    
                    {recentDocuments.length === 0 ? (
                         [
                            { id: '1', name: 'calculus_chapter1.pdf', date: 'Opened 2 hours ago', size: '2.4 MB' },
                            { id: '2', name: 'Physics_Mechanics_Notes.pdf', date: 'Opened yesterday', size: '5.1 MB' },
                            { id: '3', name: 'Chemistry_Organic_Reactions.pdf', date: 'Opened 3 days ago', size: '1.8 MB' }
                         ].map(doc => (
                            <TouchableOpacity key={doc.id} style={styles.recentCard}>
                                <View style={styles.recentIcon}>
                                    <Ionicons name="document-text" size={24} color="#4C51BF" />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{doc.name}</Text>
                                    <Text style={styles.recentMeta}>{doc.date} • {doc.size}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#ccc" />
                            </TouchableOpacity>
                         ))
                    ) : (
                        recentDocuments.map(doc => (
                            <TouchableOpacity key={doc.id} style={styles.recentCard}>
                                <View style={styles.recentIcon}>
                                    <Ionicons name="document-text" size={24} color="#4C51BF" />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{doc.name}</Text>
                                    <Text style={styles.recentMeta}>{doc.date} • {doc.size}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#ccc" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Or #f9f9f9 based on screenshot gray sides
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        marginRight: 8,
    },
    historyButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#eef2ff',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eef2ff', // Light purple
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#6b7280', // Gray-500
        textAlign: 'center',
        lineHeight: 20,
    },
    uploadCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        // Shadow for "Card" feel in white box
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    browseButton: {
        backgroundColor: '#4C51BF', // Indigo-600
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    browseButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    limitText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 32,
        height: 48,
    },
    urlInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    urlGoButton: {
        padding: 8,
        backgroundColor: '#e0f2fe', // Light blue
        borderRadius: 6,
    },
    recentSection: {
        gap: 12,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4,
    },
    recentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    recentIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recentInfo: {
        flex: 1,
    },
    recentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    recentMeta: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
