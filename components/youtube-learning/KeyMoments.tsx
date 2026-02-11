import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface KeyMomentsProps {
    timestamps: string[];
    onTimestampPress: (timestamp: string) => void;
    currentTime?: number;
}

export default function KeyMoments({ timestamps, onTimestampPress, currentTime = 0 }: KeyMomentsProps) {
    if (!timestamps || timestamps.length === 0) return null;

    const timeToSeconds = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const isTimestampActive = (ts: string) => {
        const seconds = timeToSeconds(ts);
        // Highlight if within 5 seconds match
        return Math.abs(seconds - currentTime) < 5;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={18} color="#4C51BF" />
                <Text style={styles.headerTitle}>Key Moments</Text>
            </View>

            <View style={styles.grid}>
                {timestamps.map((ts, idx) => {
                    const active = isTimestampActive(ts);
                    return (
                        <TouchableOpacity 
                            key={idx} 
                            style={[styles.chip, active && styles.activeChip]}
                            onPress={() => onTimestampPress(ts)}
                        >
                            <Ionicons name="play" size={10} color="#fff" />
                            <Text style={styles.chipText}>{ts}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 4,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginLeft: 6,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937', // Default to Dark Gray/Black for contrast as per user pref "clickable chips" logic
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.2,
        // shadowRadius: 1,
    },
    activeChip: {
        backgroundColor: '#EF4444', // YouTube Red for active
        transform: [{scale: 1.05}]
    },
    chipText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
    },
});
