import { Alert, Platform } from 'react-native';

/**
 * react-native-web ships `Alert` as a no-op, so every `Alert.alert(...)` call
 * in the app silently does nothing on web (the PWA): informational dialogs
 * never appear, and — worse — confirmation dialogs never fire their button
 * callbacks, so actions like delete / logout / save quietly do nothing.
 *
 * This patches `Alert.alert` once at startup to bridge to the browser's native
 * dialogs, so all existing `Alert.alert` call sites work on web unchanged.
 * Native (iOS/Android) is untouched and keeps the real Alert.
 *
 * Import this for its side effect once, early in the root layout.
 */
type AlertButton = {
  text?: string;
  onPress?: (value?: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
};

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Alert as any).alert = (
    title?: string,
    message?: string,
    buttons?: AlertButton[],
  ): void => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const list = buttons ?? [];
    const hasWindow = typeof window !== 'undefined';

    // 0–1 buttons → simple notice.
    if (list.length <= 1) {
      if (hasWindow) window.alert(text || '');
      list[0]?.onPress?.();
      return;
    }

    // 2+ buttons → confirm. The cancel action is the button styled 'cancel'
    // (or the first one); the confirm action is the last non-cancel button.
    const cancelBtn = list.find((b) => b.style === 'cancel');
    const confirmBtn = [...list].reverse().find((b) => b.style !== 'cancel') ?? list[list.length - 1];
    const ok = hasWindow && typeof window.confirm === 'function' ? window.confirm(text || '') : true;
    if (ok) confirmBtn?.onPress?.();
    else cancelBtn?.onPress?.();
  };
}
