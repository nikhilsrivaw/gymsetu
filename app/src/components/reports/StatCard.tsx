import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  emoji: string;
  label: string;
  value: string;
  trend?: number; // positive = up, negative = down
  trendSuffix?: string;
}

export default function StatCard({ emoji, label, value, trend, trendSuffix = '%' }: Props) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendColor = trend === undefined ? Colors.textMuted : isPositive ? Colors.green : Colors.red;
  const trendBg = trend === undefined ? 'transparent' : isPositive ? Colors.greenMuted : Colors.redMuted;
  const arrow = trend === undefined ? '' : isPositive ? '↑' : '↓';

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend !== undefined && (
        <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {arrow} {Math.abs(trend)}{trendSuffix}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  emoji: { fontSize: 22 },
  value: { fontSize: 20, fontWeight: '700', color: Colors.text },
  label: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  trendText: { fontSize: 11, fontWeight: '600' },
});
