import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface ExportOption {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  format: string;
  records: number;
}

const exportOptions: ExportOption[] = [
  { id: 'members', label: 'Members Data', desc: 'Names, phone, email, status, join date', emoji: '👥', format: 'CSV', records: 148 },
  { id: 'payments', label: 'Payment Records', desc: 'All transactions with method & date', emoji: '💳', format: 'CSV', records: 342 },
  { id: 'attendance', label: 'Attendance Log', desc: 'Daily check-in records', emoji: '📋', format: 'CSV', records: 2156 },
  { id: 'plans', label: 'Membership Plans', desc: 'Plan names, duration & pricing', emoji: '📝', format: 'CSV', records: 5 },
];

interface BackupInfo {
  lastBackup: string;
  size: string;
  autoBackup: boolean;
}

const backupInfo: BackupInfo = {
  lastBackup: '27 Feb 2026, 11:30 PM',
  size: '4.2 MB',
  autoBackup: true,
};

export default function BackupScreen() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const handleExport = (opt: ExportOption) => {
    setExporting(opt.id);
    setTimeout(() => {
      setExporting(null);
      Alert.alert('Export Ready', `${opt.label} exported as ${opt.format} (${opt.records} records).`);
    }, 1200);
  };

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      Alert.alert('Backup Complete', 'All gym data backed up successfully to cloud.');
    }, 2000);
  };

  return (
    <>
      <Stack.Screen options={{ title: '💾 Backup & Export' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Backup Status */}
        <FadeInView delay={0}>
          <View style={styles.backupCard}>
            <View style={styles.backupHeader}>
              <Text style={styles.backupEmoji}>☁️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.backupTitle}>Cloud Backup</Text>
                <Text style={styles.backupSub}>Last backup: {backupInfo.lastBackup}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: Colors.greenMuted }]}>
                <View style={[styles.statusDot, { backgroundColor: Colors.green }]} />
                <Text style={[styles.statusText, { color: Colors.green }]}>Active</Text>
              </View>
            </View>

            <View style={styles.backupMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Size</Text>
                <Text style={styles.metaValue}>{backupInfo.size}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Auto-backup</Text>
                <Text style={styles.metaValue}>{backupInfo.autoBackup ? '✅ On' : '❌ Off'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Frequency</Text>
                <Text style={styles.metaValue}>Daily</Text>
              </View>
            </View>

            <AnimatedPressable
              style={[styles.backupBtn, backingUp && { opacity: 0.6 }]}
              scaleDown={0.97}
              onPress={handleBackup}
              disabled={backingUp}
            >
              <Text style={styles.backupBtnText}>{backingUp ? '⏳ Backing up...' : '☁️ Backup Now'}</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Export Section */}
        <FadeInView delay={150}>
          <Text style={styles.sectionTitle}>📤 Export Data</Text>
          <Text style={styles.sectionSub}>Download your gym data as CSV files</Text>
        </FadeInView>

        {exportOptions.map((opt, i) => (
          <FadeInView key={opt.id} delay={200 + i * 60}>
            <View style={styles.exportCard}>
              <View style={styles.exportHeader}>
                <View style={styles.exportIcon}>
                  <Text style={styles.exportEmoji}>{opt.emoji}</Text>
                </View>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportLabel}>{opt.label}</Text>
                  <Text style={styles.exportDesc}>{opt.desc}</Text>
                  <View style={styles.exportMeta}>
                    <Text style={styles.exportBadge}>📄 {opt.format}</Text>
                    <Text style={styles.exportRecords}>{opt.records} records</Text>
                  </View>
                </View>
              </View>
              <AnimatedPressable
                style={[styles.exportBtn, exporting === opt.id && { opacity: 0.6 }]}
                scaleDown={0.95}
                onPress={() => handleExport(opt)}
                disabled={exporting !== null}
              >
                <Text style={styles.exportBtnText}>
                  {exporting === opt.id ? '⏳ Exporting...' : '⬇️ Export'}
                </Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        ))}

        {/* Danger Zone */}
        <FadeInView delay={500}>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
            <Text style={styles.dangerDesc}>
              Permanently delete all gym data. This action cannot be undone.
            </Text>
            <AnimatedPressable
              style={styles.dangerBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Delete All Data?', 'This will permanently erase everything. Are you absolutely sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Everything', style: 'destructive', onPress: () => {} },
              ])}
            >
              <Text style={styles.dangerBtnText}>🗑️ Delete All Data</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 12 },

  backupCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14,
  },
  backupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backupEmoji: { fontSize: 32 },
  backupTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  backupSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  backupMeta: { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: Colors.textMuted },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2 },
  metaDivider: { width: 1, backgroundColor: Colors.border },

  backupBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backupBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },
  sectionSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },

  exportCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  exportHeader: { flexDirection: 'row', gap: 12 },
  exportIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  exportEmoji: { fontSize: 20 },
  exportInfo: { flex: 1 },
  exportLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  exportDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  exportMeta: { flexDirection: 'row', gap: 10, marginTop: 6 },
  exportBadge: { fontSize: 11, color: Colors.textSub, fontWeight: '500' },
  exportRecords: { fontSize: 11, color: Colors.textMuted },
  exportBtn: { backgroundColor: Colors.bgElevated, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  dangerCard: {
    backgroundColor: Colors.redMuted, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.red + '25', gap: 10, marginTop: 8,
  },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: Colors.red },
  dangerDesc: { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
  dangerBtn: { backgroundColor: Colors.red + '20', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.red + '30' },
  dangerBtnText: { fontSize: 14, fontWeight: '600', color: Colors.red },
});
