import ToolHeader from '@/components/ui/ToolHeader';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface YoutubeInputViewProps {
    onUrlSubmit: (url: string) => void;
    recentVideos?: Array<{ id: string; title: string; duration: string; date: string }>;
    onClose?: () => void;
    onOpenHistory?: () => void;
    onVideoSelect?: (video: { id: string; title: string }) => void;
    onVideoDelete?: (video: { id: string; title: string }) => void;
}

export default function YoutubeInputView({ onUrlSubmit, recentVideos = [], onClose, onOpenHistory, onVideoSelect, onVideoDelete }: YoutubeInputViewProps) {
    const [url, setUrl] = React.useState('');

    const handleSubmit = () => {
        if (url.trim()) {
            onUrlSubmit(url.trim());
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <ToolHeader 
                title="YouTube Learning" 
                onClose={onClose || (() => {})} 
                onHistory={onOpenHistory || (() => {})} 
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                         <Ionicons name="logo-youtube" size={32} color="#EF4444" />
                    </View>
                    <Text style={styles.heroTitle}>Learn from YouTube</Text>
                    <Text style={styles.heroSubtitle}>
                        Paste a video link below to get an AI tutor, summaries, and Q&A.
                    </Text>
                </View>

                {/* URL Input Section */}
                <View style={styles.inputCard}>
                    <Text style={styles.label}>YouTube Video URL</Text>
                    <View style={styles.urlInputContainer}>
                        <Ionicons name="link-outline" size={20} color="#999" style={{marginRight: 8}} />
                        <TextInput 
                            style={styles.urlInput}
                            placeholder="https://youtube.com/watch?v=..."
                            placeholderTextColor="#999"
                            value={url}
                            onChangeText={setUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {url.length > 0 && (
                            <TouchableOpacity onPress={() => setUrl('')}>
                                <Ionicons name="close-circle" size={16} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.analyzeButton, !url && styles.disabledButton]} 
                        onPress={handleSubmit}
                        disabled={!url}
                    >
                        <Text style={styles.analyzeButtonText}>Analyze Video</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 8}} />
                    </TouchableOpacity>
                </View>

                {/* Recent Videos */}
                <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent Videos</Text>
                    
                    {recentVideos.length === 0 ? (
                         // Default Mocks for UI visualization if no data
                         [
                            { id: '1', title: 'Introduction to Thermodynamics', duration: '15 mins', date: '2 days ago' },
                            { id: '2', title: 'History of Modern Art', duration: '42 mins', date: '5 days ago' }
                         ].map(video => (
                            <TouchableOpacity key={video.id} style={styles.recentCard} onPress={() => onVideoSelect?.(video)}>
                                <View style={styles.recentIcon}>
                                    <Ionicons name="play-circle" size={24} color="#EF4444" />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{video.title}</Text>
                                    <Text style={styles.recentMeta}>{video.duration} • {video.date}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#ccc" />
                            </TouchableOpacity>
                         ))
                    ) : (
                        recentVideos.map(video => (
                            <TouchableOpacity 
                                key={video.id} 
                                style={styles.recentCard} 
                                onPress={() => onVideoSelect?.(video)}
                                onLongPress={() => onVideoDelete?.(video)}
                                delayLongPress={500}
                            >
                                <View style={styles.recentIcon}>
                                    <Ionicons name="play-circle" size={24} color="#EF4444" />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{video.title}</Text>
                                    <Text style={styles.recentMeta}>{video.duration} • {video.date}</Text>
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        backgroundColor: '#FEF2F2', // Light Red
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
        backgroundColor: '#FEF2F2', // Light red
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
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    inputCard: {
        backgroundColor: '#fff',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
    },
    urlInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    analyzeButton: {
        backgroundColor: '#4C51BF', // Indigo-600
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: '#4C51BF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledButton: {
        backgroundColor: '#A5A6D6',
        shadowOpacity: 0,
    },
    analyzeButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
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
        backgroundColor: '#FEF2F2',
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
