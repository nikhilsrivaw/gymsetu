import React, { forwardRef } from 'react';
import { Platform, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

/**
 * Drop-in replacement for lottie-react-native's LottieView.
 *
 * On web, the dotlottie renderer ignores a fixed width/height passed via
 * `style` and can render far larger than intended — which squeezes sibling
 * content (e.g. titles collapsing into a vertical single-letter column).
 *
 * This wraps the animation in a box that carries the intended size and clips
 * overflow, then tells the animation to fill that box (100% x 100%), so it
 * scales down to the size the layout expects. Native is passed through as-is.
 */
type AppLottieProps = React.ComponentProps<typeof LottieView>;

const AppLottie = forwardRef<any, AppLottieProps>(({ style, ...rest }, ref) => {
  if (Platform.OS !== 'web') {
    return <LottieView ref={ref} style={style} {...rest} />;
  }

  const flat = (StyleSheet.flatten(style) || {}) as StyleProp<ViewStyle>;
  return (
    <View style={[{ overflow: 'hidden' }, flat]}>
      <LottieView ref={ref} style={styles.fill} {...rest} />
    </View>
  );
});

AppLottie.displayName = 'AppLottie';

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});

export default AppLottie;
