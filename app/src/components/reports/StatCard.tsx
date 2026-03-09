
  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { Colors } from '@/constants/colors';

  interface Props {
    emoji: string;
    label: string;
    value: string;
    color?: string;
  }

  export default function StatCard({ emoji, label, value, color = Colors.accent }: Props) {
    return (
      <View style={[styles.card, { borderColor: color + '25' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    card:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, padding: 12, alignItems:     
  'center', gap: 4 },
    emoji: { fontSize: 20 },
    value: { fontSize: 18, fontWeight: '700' },
    label: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', letterSpacing: 0.5 },
  });