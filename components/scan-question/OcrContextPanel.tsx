import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScannedImage {
    image_url: string;
    extracted_text?: string;
    extraction_timestamp?: string;
}

interface OcrContextPanelProps {
    images: ScannedImage[];
}

export default function OcrContextPanel({ images }: OcrContextPanelProps) {
    const [expanded, setExpanded] = useState(false); // Collapsed by default if many images

    if (!images || images.length === 0) return null;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name="images-outline" size={18} color="#4b5563" />
                    <Text style={styles.headerTitle}>Uploaded Images ({images.length})</Text>
                </View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
            </TouchableOpacity>
            
            {expanded && (
                <ScrollView style={styles.listContainer} nestedScrollEnabled>
                   {images.map((img, idx) => (
                       <View key={idx} style={styles.imageItem}>
                           <Image source={{ uri: img.image_url }} style={styles.thumbnail} />
                           <View style={styles.infoCol}>
                               <Text style={styles.debugText} numberOfLines={2}>
                                   {img.extracted_text || "Image context available"}
                               </Text>
                               {img.extraction_timestamp && (
                                   <Text style={styles.timestamp}>{new Date(img.extraction_timestamp).toLocaleTimeString()}</Text>
                               )}
                           </View>
                       </View>
                   ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f9fafb',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    listContainer: {
        maxHeight: 200,
        padding: 12,
    },
    imageItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 8,
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 4,
        backgroundColor: '#eee',
        marginRight: 10,
    },
    infoCol: {
        flex: 1,
    },
    debugText: {
        fontSize: 12,
        color: '#4b5563',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#9ca3af',
    }
});
