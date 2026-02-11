import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PodcastItemProps {
    podcast: {
        topic: string;
        audio_url: string;
        duration_seconds: number;
        created_at: string;
    };
    isPlaying?: boolean;
    onPlayPause?: () => void;
}

export default function PodcastItem({ podcast, isPlaying, onPlayPause }: PodcastItemProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(podcast.duration_seconds * 1000); // Estimate
    const [localIsPlaying, setLocalIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
             if (sound) {
                 sound.unloadAsync();
             }
        };
    }, [sound]);

    const handlePlayPause = async () => {
        if (!songLoaded()) {
             await loadSound();
        } else {
             if (localIsPlaying) {
                 await sound?.pauseAsync();
                 setLocalIsPlaying(false);
             } else {
                 await sound?.playAsync();
                 setLocalIsPlaying(true);
             }
        }
    };

    const songLoaded = () => !!sound;

    const loadSound = async () => {
        setIsLoading(true);
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: podcast.audio_url },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            setLocalIsPlaying(true);
        } catch (error) {
            console.error("Failed to load sound", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || duration);
            setLocalIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                 setLocalIsPlaying(false);
                 setPosition(0);
                 // sound?.setPositionAsync(0);
            }
        }
    };

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                 <Ionicons name="mic-circle" size={40} color="#818cf8" />
            </View>
            <View style={styles.contentContainer}>
                 <Text style={styles.topic}>{podcast.topic}</Text>
                 <Text style={styles.date}>{new Date(podcast.created_at).toLocaleDateString()}</Text>
                 
                 <View style={styles.controls}>
                      <TouchableOpacity onPress={handlePlayPause} disabled={isLoading}>
                          {isLoading ? (
                              <ActivityIndicator color="#4f46e5" />
                          ) : (
                              <Ionicons name={localIsPlaying ? "pause-circle" : "play-circle"} size={36} color="#4f46e5" />
                          )}
                      </TouchableOpacity>
                      
                      <View style={styles.progressContainer}>
                           <View style={[styles.progressBar, { width: `${(position / duration) * 100}%` }]} />
                      </View>
                      
                      <Text style={styles.timer}>{formatTime(position)} / {formatTime(duration)}</Text>
                 </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF', // Strict Rule: White Card
        borderRadius: 16,
        borderTopLeftRadius: 4, // AI Alignment style
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        marginRight: 12,
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    topic: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937', // Dark Gray
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
        color: '#6B7280', // Light Gray
        marginBottom: 12,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
        height: 4,
        backgroundColor: '#E5E7EB', // Light gray track
        borderRadius: 2,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5', // Indigo
    },
    timer: {
        fontSize: 12,
        color: '#6B7280', // Medium Gray
        fontVariant: ['tabular-nums'],
    }
});
