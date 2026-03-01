import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import { Colors } from '@/constants/colors';

const fontConfig = {
  displayLarge: { fontWeight: '700' as const },
  displayMedium: { fontWeight: '700' as const },
  displaySmall: { fontWeight: '600' as const },
  headlineLarge: { fontWeight: '700' as const },
  headlineMedium: { fontWeight: '600' as const },
  headlineSmall: { fontWeight: '600' as const },
  titleLarge: { fontWeight: '700' as const },
  titleMedium: { fontWeight: '600' as const },
  titleSmall: { fontWeight: '600' as const },
  bodyLarge: { fontWeight: '400' as const },
  bodyMedium: { fontWeight: '400' as const },
  bodySmall: { fontWeight: '400' as const },
  labelLarge: { fontWeight: '600' as const },
  labelMedium: { fontWeight: '500' as const },
  labelSmall: { fontWeight: '500' as const },
};

export const appTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.accent,
    primaryContainer: Colors.accentMuted,
    secondary: Colors.accent,
    secondaryContainer: Colors.accentMuted,
    background: Colors.bg,
    surface: Colors.bgCard,
    surfaceVariant: Colors.bgElevated,
    error: Colors.red,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: Colors.accent,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: Colors.accent,
    onBackground: Colors.text,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSub,
    onError: '#FFFFFF',
    outline: Colors.border,
    outlineVariant: Colors.borderLight,
    elevation: {
      level0: 'transparent',
      level1: Colors.bgCard,
      level2: Colors.bgElevated,
      level3: Colors.bgInput,
      level4: '#2A2A2D',
      level5: '#303033',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 14,
};

export type AppTheme = typeof appTheme;
