 import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Switch, TextInput }
  from 'react-native';                           
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';                     
  import { useState } from 'react';  
  import {Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                                                                    
  import AnimatedPressable from '@/components/AnimatedPressable';                                                                                                         
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];                                                                                              type SettingToggle = {                                                                 kind: 'toggle';                                                                  
    label: string;
    desc: string;
    icon: IconName;
    color: string;
    key: string;
  };

  type SettingAction = {
    kind: 'action';
    label: string;
    desc: string;
    icon: IconName;
    color: string;
    value?: string;
    onPress: () => void;
  };

  type Setting = SettingToggle | SettingAction;

  type Section = {
    title: string;
    items: Setting[];
  };

  export default function SettingsScreen() {
    const [pinModal, setPinModal]         = useState(false);
    const [notifModal, setNotifModal]     = useState(false);
    const [pin, setPin]                   = useState('');
    const [confirmPin, setConfirmPin]     = useState('');

    const [toggles, setToggles] = useState<Record<string, boolean>>({
      expiryAlerts:   true,
      paymentAlerts:  true,
      newMember:      true,
      dailySummary:   false,
      biometric:      false,
      autoBackup:     true,
      darkMode:       true,
      soundEffects:   false,
    });

    const toggle = (key: string) =>
      setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    const sections: Section[] = [
      {
        title: 'NOTIFICATIONS',
        items: [
          { kind: 'toggle', label: 'Expiry Alerts',    desc: 'Notify when memberships near expiry', icon: 'bell-alert-outline',    color: Colors.orange, key: 'expiryAlerts'   },
          { kind: 'toggle', label: 'Payment Alerts',   desc: 'Notify on every payment received',    icon: 'cash-check',            color: Colors.green,  key:'paymentAlerts'  },
          { kind: 'toggle', label: 'New Member Alert', desc: 'Notify when a new member joins',       icon: 'account-plus-outline',  color: Colors.accent, key: 'newMember'      },
          { kind: 'toggle', label: 'Daily Summary',    desc: 'End-of-day stats  digest',              icon: 'chart-bar',             color: '#3B82F6',     key:  'dailySummary'   },
          {
            kind: 'action', label: 'Notification Schedule', desc: 'Set quiet hours', 
            icon: 'clock-outline', color: '#A78BFA', value: '10 PM – 6 AM',
            onPress: () => setNotifModal(true),
          },
        ],
      },
      {
        title: 'SECURITY',
        items: [
          { kind: 'toggle', label: 'Biometric Lock',  desc: 'Fingerprint / Face ID on open',     icon: 'fingerprint',           color: Colors.accent, key: 'biometric'  
  },
          {
            kind: 'action', label: 'Change PIN',       desc: 'Update your 4-digit access PIN',
            icon: 'lock-outline', color: Colors.orange,
            onPress: () => setPinModal(true),
          },
          {
            kind: 'action', label: 'Active Sessions',  desc: 'Manage logged-in  devices',
            icon: 'devices', color: Colors.red, value: '1 device',
            onPress: () => {},
          },
        ],
      },
      {
        title: 'DATA & STORAGE',
        items: [
          { kind: 'toggle', label: 'Auto Backup',     desc: 'Daily cloud backup at midnight',    icon: 'cloud-upload-outline',  color: Colors.green,  key:'autoBackup'  },
          {
            kind: 'action', label: 'Storage Used',     desc: 'App data & cached  files',
            icon: 'database-outline', color: '#3B82F6', value: '84 MB',
            onPress: () => {},
          },
          {
            kind: 'action', label: 'Clear Cache',      desc: 'Free up temporary files',
            icon: 'broom', color: Colors.orange,
            onPress: () => {},
          },
        ],
      },
      {
        title: 'APPEARANCE',
        items: [
          { kind: 'toggle', label: 'Dark Mode',       desc: 'Industrial dark theme  (recommended)',icon: 'theme-light-dark',      color: Colors.accent, key: 'darkMode'
       },
          { kind: 'toggle', label: 'Sound Effects',   desc: 'UI tap & action sounds',
               icon: 'volume-high',           color: '#EC4899',     key:
  'soundEffects' },
          {
            kind: 'action', label: 'App Language',     desc: 'Display language',     
            icon: 'translate', color: '#A78BFA', value: 'English',
            onPress: () => {},
          },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          {
            kind: 'action', label: 'Subscription Plan', desc: 'GymSetu Pro — renews  Jun 2025',
            icon: 'crown-outline', color: Colors.accent, value: 'PRO',
            onPress: () => {},
          },
          {
            kind: 'action', label: 'Privacy Policy',    desc: 'View data usage  policy',
            icon: 'shield-outline', color: Colors.textMuted,
            onPress: () => {},
          },
          {
            kind: 'action', label: 'Terms of Service',  desc: 'Usage terms &conditions',
            icon: 'file-document-outline', color: Colors.textMuted,
            onPress: () => {},
          },
        ],
      },
    ];

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="cog-outline" size={26}
  color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>CONFIGURATION</Text>
                <Text style={styles.heroTitle}>SETTINGS</Text>
                <Text style={styles.heroSub}>Manage your app preferences</Text>      
              </View>
            </View>
          </FadeInView>

          {/* ── Sections ─────────────────────────────────────── */}
          {sections.map((section, si) => (
            <FadeInView key={section.title} delay={60 + si * 60}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, ii) => {
                  const isLast = ii === section.items.length - 1;

                  if (item.kind === 'toggle') {
                    return (
                      <View key={item.label} style={[styles.settingRow, !isLast &&   
  styles.rowBorder]}>
                        <View style={[styles.settingIcon, { backgroundColor:
  item.color + '18' }]}>
                          <MaterialCommunityIcons name={item.icon} size={17}
  color={item.color} />
                        </View>
                        <View style={styles.settingText}>
                          <Text style={styles.settingLabel}>{item.label}</Text>      
                          <Text style={styles.settingDesc}>{item.desc}</Text>        
                        </View>
                        <Switch
                          value={toggles[item.key]}
                          onValueChange={() => toggle(item.key)}
                          trackColor={{ false: Colors.border, true: Colors.accent +  
  '60' }}
                          thumbColor={toggles[item.key] ? Colors.accent :
  Colors.textMuted}
                          ios_backgroundColor={Colors.border}
                        />
                      </View>
                    );
                  }

                  return (
                    <AnimatedPressable
                      key={item.label}
                      style={[styles.settingRow, !isLast && styles.rowBorder]}       
                      scaleDown={0.98}
                      onPress={item.onPress}
                    >
                      <View style={[styles.settingIcon, { backgroundColor: item.color
   + '18' }]}>
                        <MaterialCommunityIcons name={item.icon} size={17}
  color={item.color} />
                      </View>
                      <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>{item.label}</Text>        
                        <Text style={styles.settingDesc}>{item.desc}</Text>
                      </View>
                      {item.value && (
                        <Text style={styles.settingValue}>{item.value}</Text>        
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={17}
  color={Colors.textMuted} />
                    </AnimatedPressable>
                  );
                })}
              </View>
            </FadeInView>
          ))}

          {/* ── Danger Zone ──────────────────────────────────── */}
          <FadeInView delay={420}>
            <Text style={styles.sectionLabel}>DANGER ZONE</Text>
            <View style={styles.dangerCard}>
              <AnimatedPressable style={styles.dangerRow} scaleDown={0.98}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.red +    
  '18' }]}>
                  <MaterialCommunityIcons name="account-remove-outline" size={17}    
  color={Colors.red} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: Colors.red }]}>Delete  
  Account</Text>
                  <Text style={styles.settingDesc}>Permanently remove all gym        
  data</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={17}
  color={Colors.red} />
              </AnimatedPressable>
            </View>
          </FadeInView>

          <Text style={styles.version}>GYMSETU v1.0.0  ·  Build 2024.06</Text>       
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Change PIN Modal ─────────────────────────────── */}
        <Modal visible={pinModal} transparent animationType="slide"
  onRequestClose={() => setPinModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setPinModal(false)} />   
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CHANGE PIN</Text>
              <Pressable style={styles.closeBtn} onPress={() => setPinModal(false)}> 
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>NEW PIN</Text>
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={styles.input}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>CONFIRM PIN</Text>
              <TextInput
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Re-enter PIN"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <AnimatedPressable style={styles.saveBtn} scaleDown={0.97} onPress={() =>
   setPinModal(false)}>
              <Text style={styles.saveBtnText}>UPDATE PIN</Text>
            </AnimatedPressable>
          </View>
        </Modal>

        {/* ── Notification Schedule Modal ───────────────────── */}
        <Modal visible={notifModal} transparent animationType="slide"
  onRequestClose={() => setNotifModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setNotifModal(false)} /> 
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QUIET HOURS</Text>
              <Pressable style={styles.closeBtn} onPress={() =>
  setNotifModal(false)}>
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Notifications will be silenced during quiet
   hours.</Text>
            <View style={styles.quietRow}>
              <View style={styles.quietBox}>
                <Text style={styles.quietLabel}>FROM</Text>
                <Text style={styles.quietTime}>10:00 PM</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18}
  color={Colors.textMuted} />
              <View style={styles.quietBox}>
                <Text style={styles.quietLabel}>TO</Text>
                <Text style={styles.quietTime}>6:00 AM</Text>
              </View>
            </View>
            <AnimatedPressable style={styles.saveBtn} scaleDown={0.97} onPress={() =>
   setNotifModal(false)}>
              <Text style={styles.saveBtnText}>SAVE SCHEDULE</Text>
            </AnimatedPressable>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1 },
    scroll:    { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },

    // Hero
    hero: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden', marginBottom: 20,
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroIcon: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '30',
    },
    heroMicro: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,        
  letterSpacing: 1.5 },
    heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text,  
  letterSpacing: 0.5 },
    heroSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2 },

    // Section
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 8, marginTop: 4 },
    sectionCard:  { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1,
   borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },

    // Setting row
    settingRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingHorizontal: 14, paddingVertical: 13 },
    rowBorder:   { borderBottomWidth: 1, borderBottomColor: Colors.border },
    settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center',
   alignItems: 'center' },
    settingText: { flex: 1 },
    settingLabel:{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },       
    settingDesc: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, 
  marginTop: 1 },
    settingValue:{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent,       
  letterSpacing: 0.5 },

    // Danger
    dangerCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1,  
  borderColor: Colors.red + '30', overflow: 'hidden', marginBottom: 20 },
    dangerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingHorizontal: 14, paddingVertical: 13 },

    version: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted,       
  textAlign: 'center', letterSpacing: 1.5 },

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' 
  },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor:
  Colors.border, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:
   'center', marginBottom: 20 },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text,
   letterSpacing: 0.5 },
    modalSub:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, 
  marginBottom: 20 },
    closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },

    fieldWrap:   { marginBottom: 14 },
    fieldLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,     
  letterSpacing: 1.2, marginBottom: 6 },
    input: {
      backgroundColor: Colors.bgElevated, borderRadius: 10,
      borderWidth: 1, borderColor: Colors.border,
      paddingHorizontal: 14, paddingVertical: 11,
      fontFamily: Fonts.regular, fontSize: 14, color: Colors.text,
    },

    saveBtn:     { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical:
   14, alignItems: 'center', marginTop: 8 },
    saveBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.bg,
  letterSpacing: 1.2 },

    // Quiet hours
    quietRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
   gap: 20, marginBottom: 24 },
    quietBox: { alignItems: 'center', backgroundColor: Colors.bgElevated,
  borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1,      
  borderColor: Colors.border },
    quietLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,      
  letterSpacing: 1, marginBottom: 4 },
    quietTime:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text  
  },
  });