import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export interface VideoSectionProps {
  needOfManim: 'YES' | 'No';
  manimVideoPath: string;
  mainVideoPrompt?: string;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  needOfManim,
  manimVideoPath,
  mainVideoPrompt,
}) => {
  const shouldRender =
    typeof manimVideoPath === 'string' &&
    manimVideoPath.startsWith('http') &&
    needOfManim.toUpperCase() === 'YES';

  if (!shouldRender) return null;

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          source={{ uri: manimVideoPath }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      </View>
      {mainVideoPrompt ? <Text style={styles.caption}>{mainVideoPrompt}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    color: '#4B5563',
  },
});

export default VideoSection;

