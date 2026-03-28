import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';                                             
  import { useRouter } from 'expo-router';                                                                             
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import LottieView from 'lottie-react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';

  export default function NotFoundScreen() {
    const router = useRouter();

    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.glow} />

        <View style={s.container}>
          {/* Lottie */}
          <View style={s.lottieWrap}>
            <LottieView
              source={require('@/assets/animations/404.json')}
              autoPlay
              loop
              style={s.lottie}
            />
          </View>

          {/* Text */}
          <View style={s.textBlock}>
            <Text style={s.code}>404</Text>
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divText}>PAGE NOT FOUND</Text>
              <View style={s.divLine} />
            </View>
            <Text style={s.desc}>
              Looks like this page took a rest day.{'\n'}
              Let's get you back on track.
            </Text>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.primaryBtn}
              activeOpacity={0.82}
              onPress={() => router.replace('/')}
            >
              <MaterialCommunityIcons name="home-outline" size={18} color="#000" />
              <Text style={s.primaryBtnText}>GO HOME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryBtn}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color="#888" />
              <Text style={s.secondaryBtnText}>GO BACK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom branding */}
        <View style={s.footer}>
          <Text style={s.footerText}>GYMSETU · THE COMPLETE GYM OS</Text>
        </View>
      </SafeAreaView>
    );
  }

  const s = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: '#0a0a0a' },
    glow:      { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 130,
  backgroundColor: Colors.accent + '14' },

    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 32 },

    lottieWrap: {
      width: 260, height: 260,
      backgroundColor: '#141414',
      borderRadius: 32,
      borderWidth: 1,
      borderColor: '#1e1e1e',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    lottie: { width: 240, height: 240 },

    textBlock: { alignItems: 'center', gap: 12, alignSelf: 'stretch' },
    code:      { fontFamily: Fonts.condensedBold, fontSize: 80, color: Colors.accent, letterSpacing: 8, lineHeight: 84 
  },

    divRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
    divLine: { flex: 1, height: 1, backgroundColor: '#1e1e1e' },
    divText: { fontFamily: Fonts.bold, fontSize: 9, color: '#444', letterSpacing: 2.5 },

    desc: { fontFamily: Fonts.regular, fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24 },

    actions: { alignSelf: 'stretch', gap: 12 },

    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: Colors.accent, borderRadius: 18, paddingVertical: 18,
    },
    primaryBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#000', letterSpacing: 2 },

    secondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#141414', borderRadius: 18, paddingVertical: 16,
      borderWidth: 1, borderColor: '#1e1e1e',
    },
    secondaryBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: '#666', letterSpacing: 1.5 },

    footer:     { paddingBottom: 16, alignItems: 'center' },
    footerText: { fontFamily: Fonts.bold, fontSize: 9, color: '#2a2a2a', letterSpacing: 2 },
  });