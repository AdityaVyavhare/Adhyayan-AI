import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OcrContextCardProps {
  imageUri?: string;
  extractedText: string;
  timestamp?: string;
  imageCount?: number;
}

export default function OcrContextCard({ imageUri, extractedText, timestamp, imageCount = 1 }: OcrContextCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
            <View style={styles.iconBox}>
                <Ionicons name="image-outline" size={20} color="#4b5563" />
            </View>
            <View>
                <Text style={styles.title}>Image context</Text>
                <Text style={styles.subtitle}>{imageCount} images • OCR extracted</Text>
            </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Content */}
      {expanded && (
          <View style={styles.body}>
             <View style={styles.row}>
                 {imageUri && (
                     <Image source={{ uri: imageUri }} style={styles.thumbnail} />
                 )}
                 <View style={styles.textContainer}>
                     <View style={styles.textHeader}>
                         <Text style={styles.extractedLabel}>Extracted text</Text>
                         <Text style={styles.timestamp}>{timestamp || 'Just now'}</Text>
                     </View>
                     <Text style={styles.textContent} numberOfLines={imageUri ? 5 : undefined}>
                         {extractedText}
                     </Text>
                 </View>
             </View>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: '#f9fafb',
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  iconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1f2937',
  },
  subtitle: {
      fontSize: 12,
      color: '#6b7280',
  },
  body: {
      padding: 12,
  },
  row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
  },
  thumbnail: {
      width: 60,
      height: 80,
      borderRadius: 4,
      backgroundColor: '#eee',
      marginRight: 12,
  },
  textContainer: {
      flex: 1,
  },
  textHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
  },
  extractedLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#6b7280',
      textTransform: 'uppercase',
  },
  timestamp: {
      fontSize: 11,
      color: '#9ca3af',
  },
  textContent: {
      fontSize: 13,
      color: '#374151',
      lineHeight: 20,
  },
});
