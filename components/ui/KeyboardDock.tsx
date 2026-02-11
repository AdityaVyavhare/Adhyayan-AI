import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardEvent, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface KeyboardDockProps extends PropsWithChildren {
  /**
   * Extra spacing between the top of the keyboard and the docked content.
   * Useful when you want a subtle gap above the keyboard.
   */
  keyboardGap?: number;
}

/**
 * Positions children at the bottom of the screen and smoothly animates them
 * to sit above the keyboard when it opens. Works consistently across tools.
 */
export default function KeyboardDock({ children, keyboardGap = 0 }: KeyboardDockProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const effectiveKeyboardHeight = useMemo(() => {
    // On iOS, safe area bottom can overlap with keyboard measurements in some cases.
    // We clamp to avoid negative values.
    return Math.max(0, keyboardHeight - (Platform.OS === 'ios' ? insets.bottom : 0));
  }, [keyboardHeight, insets.bottom]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      const h = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(h);
      Animated.timing(translateY, {
        toValue: -(Math.max(0, h - (Platform.OS === 'ios' ? insets.bottom : 0)) + keyboardGap),
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const onHide = (e?: KeyboardEvent) => {
      setKeyboardHeight(0);
      Animated.timing(translateY, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e?.duration ?? 250 : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [translateY, insets.bottom, keyboardGap]);

  return (
    <Animated.View pointerEvents="box-none" style={[styles.dock, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  inner: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

