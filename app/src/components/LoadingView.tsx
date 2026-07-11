 import LottieView from '@/components/AppLottie';                                                                          import { View, Text, StyleSheet } from 'react-native';                                                               

  interface LoadingViewProps {
    message?: string;
  }

  export default function LoadingView({ message = 'Loading...' }: LoadingViewProps) {
    return (
      <View style={s.container}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay
          loop
          style={s.lottie}
        />
        <Text style={s.text}>{message}</Text>
      </View>
    );
  }

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0a0a0a',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lottie: {
      width: 180,
      height: 180,
    },
    text: {
      color: '#666',
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  });
