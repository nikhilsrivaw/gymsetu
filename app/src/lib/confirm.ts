import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 *
 * React Native's `Alert.alert` does NOT work on web — the dialog (and its
 * button `onPress` callbacks) never fire, so any action gated behind it
 * (logout, delete, etc.) silently does nothing. On web we fall back to the
 * browser's native `window.confirm`. Native keeps the nice Alert.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  opts?: { confirmText?: string; cancelText?: string; destructive?: boolean },
): void {
  const confirmText = opts?.confirmText ?? 'OK';

  if (Platform.OS === 'web') {
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(message ? `${title}\n\n${message}` : title)
        : true;
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: opts?.cancelText ?? 'Cancel', style: 'cancel' },
    { text: confirmText, style: opts?.destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
