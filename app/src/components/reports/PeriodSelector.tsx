import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';

interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function PeriodSelector({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {options.map(opt => {
        const active = opt === selected;
        return (
          <AnimatedPressable
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            scaleDown={0.95}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  chipTextActive: { color: Colors.accent, fontWeight: '600' },
});
