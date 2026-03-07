 import { View, StyleSheet, Text } from 'react-native';                               import AnimatedPressable from '@/components/AnimatedPressable';                      import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                                                                                                                export type Period = 'week' | 'month' | 'year';                                                                                                                           interface Props {                                                                  
    value:    Period;                                                                    onChange: (p: Period) => void;                                                   
  }                                                                                                                                                                       
  const options: { label: string; value: Period }[] = [                              
    { label: 'WEEK',  value: 'week'  },                                              
    { label: 'MONTH', value: 'month' },
    { label: 'YEAR',  value: 'year'  },
  ];

  export default function PeriodSelector({ value, onChange }: Props) {
    return (
      <View style={styles.row}>
        {options.map(o => (
          <AnimatedPressable
            key={o.value}
            style={[styles.chip, value === o.value && styles.chipActive]}
            scaleDown={0.94}
            onPress={() => onChange(o.value)}
          >
            <Text style={[styles.text, value === o.value && styles.textActive]}>     
              {o.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    row:       { flexDirection: 'row', gap: 8 },
    chip:      { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,        
  backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },      
    chipActive:{ backgroundColor: Colors.accent, borderColor: Colors.accent },       
    text:      { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,       
  letterSpacing: 1 },
    textActive:{ color: '#FFF' },
  });
