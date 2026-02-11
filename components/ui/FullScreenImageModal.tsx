import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenImageModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function FullScreenImageModal({ visible, imageUrl, onClose }: FullScreenImageModalProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      resetTransform();
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
          // Allow swipe down to close if simpler
          translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
         // If likely a swipe down/up interaction to close
         if (Math.abs(e.translationY) > 100) {
             runOnJS(onClose)();
         } else {
             translateY.value = withSpring(0);
         }
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value !== 1) {
        resetTransform();
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });
    
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
      opacity: opacity.value
  }));

  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, containerStyle]}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </Animated.View>

        <GestureHandlerRootView style={styles.gestureRoot}>
            <GestureDetector gesture={Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture)}>
                <Animated.Image
                    source={{ uri: imageUrl }}
                    style={[styles.image, animatedStyle]}
                    resizeMode="contain"
                />
            </GestureDetector>
        </GestureHandlerRootView>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
             <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
      backgroundColor: 'rgba(0,0,0,0.85)',
  },
  gestureRoot: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 999,
  },
});
