import { View, Text, StyleSheet } from 'react-native';
  import { Colors } from '@/constants/colors';   
  import { Fonts } from '@/constants/fonts';
                                                 
  interface Props {               
    emoji: string;                                     
    label: string;
    value: string;
    sub?:  string;                                                                       color?: string;
  }                                                                                                                                                                       
  export default function StatCard({ emoji, label, value, sub, color = Colors.accent 
  }: Props) {                                                                        
    return (
      <View style={[styles.card, { borderColor: color + '25' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    );
  }

  const styles = StyleSheet.create({
    card:  {
      flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
    },
    emoji: { fontSize: 22, marginBottom: 2 },
    value: { fontFamily: Fonts.condensedBold, fontSize: 22 },
    label: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,
  letterSpacing: 1, textAlign: 'center' },
    sub:   { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted,        
  textAlign: 'center' },
  });