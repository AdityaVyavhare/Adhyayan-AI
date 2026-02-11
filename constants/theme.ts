/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Primary brand colors
const primaryLight = '#2563EB'; // blue-600
const primaryDark = '#60A5FA';  // blue-400

const accentLight = '#0F172A';  // slate-900 (active elements)
const accentDark = '#E5E7EB';   // slate-200

export const Colors = {
  light: {
    background: '#F8FAFC',       // slate-50
    surface: '#FFFFFF',
    text: '#0F172A',             // slate-900
    textSecondary: '#475569',    // slate-600

    tint: primaryLight,
    accent: accentLight,

    border: '#E2E8F0',           // slate-200

    icon: '#64748B',             // slate-500
    tabIconDefault: '#64748B',
    tabIconSelected: '#0F172A',  // DARK active tab ✅
  },

  dark: {
    background: '#020617',       // slate-950
    surface: '#020617',
    text: '#F8FAFC',             // slate-50
    textSecondary: '#CBD5E1',    // slate-300

    tint: primaryDark,
    accent: accentDark,

    border: '#1E293B',           // slate-800

    icon: '#94A3B8',             // slate-400
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#F8FAFC',  // BRIGHT active tab ✅
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
