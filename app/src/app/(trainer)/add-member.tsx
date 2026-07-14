import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput as RNTextInput, Modal, TouchableOpacity,
  ActivityIndicator, Keyboard, Pressable, Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { MembershipPlan } from '@/types/database';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Credentials { code: string; password: string; name: string; phone: string; }

const DOB_RE   = /^\d{2}\/\d{2}\/\d{4}$/;
const PHONE_RE = /^\d{10,15}$/;

const parseDob = (raw: string): string | null => {
  const parts = raw.split('/');
  if (parts.length === 3 && parts[2].length === 4)
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  return null;
};

// ── Reusable field ───────────────────────────────────────────────
function Field({
  icon, label, required, value, onChange, ...rest
}: {
  icon: IconName; label: string; required?: boolean;
  value: string; onChange: (v: string) => void;
  [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fld.outer, focused && fld.outerFocused]}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={focused ? Colors.accent : Colors.textMuted}
        style={fld.icon}
      />
      <View style={fld.col}>
        <Text style={[fld.lbl, focused && fld.lblFocused]}>
          {label}{required ? ' *' : ''}
        </Text>
        <RNTextInput
          style={fld.inp}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={Colors.textMuted}
          {...rest}
        />
      </View>
    </View>
  );
}

const fld = StyleSheet.create({
  outer: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: Colors.bgElevated,
    borderRadius:   14,
    borderWidth:    1,
    borderColor:    Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap:            12,
  },
  outerFocused: { borderColor: Colors.accent + '70' },
  icon: { width: 20, textAlign: 'center' },
  col:  { flex: 1 },
  lbl:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 4 },
  lblFocused: { color: Colors.accent },
  inp:  { fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0, margin: 0 },
});

// ── Pill selector ────────────────────────────────────────────────
function PillSelector({
  options, value, onChange,
}: {
  options: { label: string; value: string; icon?: IconName }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={ps.row}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[ps.pill, active && ps.pillActive]}
            onPress={() => onChange(opt.value)}
          >
            {opt.icon && (
              <MaterialCommunityIcons
                name={opt.icon}
                size={13}
                color={active ? Colors.accent : Colors.textMuted}
              />
            )}
            <Text style={[ps.label, active && ps.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ps = StyleSheet.create({
  row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  pillActive:{ borderColor: Colors.accent + '55', backgroundColor: Colors.accentMuted },
  label:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  labelActive:{ color: Colors.accent },
});

// ── Notes textarea ───────────────────────────────────────────────
function NoteArea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[na.outer, focused && na.outerFocused]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} pointerEvents="none" style={[na.rule, { top: 52 + i * 24 }]} />
      ))}
      <View style={na.header}>
        <MaterialCommunityIcons
          name="pencil-outline"
          size={15}
          color={focused ? Colors.accent : Colors.textMuted}
        />
        <Text style={[na.lbl, focused && na.lblFocused]}>ADDITIONAL NOTES</Text>
        {value.length > 0 && (
          <Text style={na.count}>{value.length} chars</Text>
        )}
      </View>
      <RNTextInput
        style={na.inp}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Any remarks, allergies, special requirements…"
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const na = StyleSheet.create({
  outer: {
    backgroundColor: Colors.bgElevated,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         14,
    minHeight:       140,
    overflow:        'hidden',
  },
  outerFocused: { borderColor: Colors.accent + '70' },
  rule: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginBottom:   10,
  },
  lbl:       { flex: 1, fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.5 },
  lblFocused:{ color: Colors.accent },
  count:     { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted },
  inp: {
    fontFamily:       Fonts.regular,
    fontSize:         14,
    color:            Colors.text,
    padding:          0,
    margin:           0,
    minHeight:        96,
    textAlignVertical:'top',
    lineHeight:       24,
  },
});

// ── Section card wrapper ─────────────────────────────────────────
function SectionCard({
  icon, iconColor, title, children,
}: {
  icon: IconName; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <View style={sc.card}>
      <LinearGradient
        colors={[iconColor + '0C', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={sc.header}>
        <View style={[sc.iconBox, { backgroundColor: iconColor + '18' }]}>
          <MaterialCommunityIcons name={icon} size={14} color={iconColor} />
        </View>
        <Text style={[sc.title, { color: iconColor }]}>{title}</Text>
      </View>
      <View style={sc.divider} />
      <View style={sc.body}>{children}</View>
    </View>
  );
}

const sc = StyleSheet.create({
  card:   { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  iconBox:{ width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  title:  { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 2 },
  divider:{ height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  body:   { padding: 16, gap: 12 },
});

// ── Main screen ──────────────────────────────────────────────────
export default function TrainerAddMemberScreen() {
  const router = useRouter();
  const { profile, gymProfile } = useAuthStore();

  const [fullName, setFullName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [email, setEmail]                   = useState('');
  const [gender, setGender]                 = useState('male');
  const [dob, setDob]                       = useState('');
  const [height, setHeight]                 = useState('');
  const [weight, setWeight]                 = useState('');
  const [goal, setGoal]                     = useState('general_fitness');
  const [emergencyName, setEmergencyName]   = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes]                   = useState('');
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');
  const [credentials, setCredentials]       = useState<Credentials | null>(null);
  const [plans, setPlans]                   = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Trainer always belongs to exactly one gym
  const gymId = profile?.gym_id;

  useEffect(() => {
    if (!gymId) return;
    supabase
      .from('membership_plans')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('price', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPlans(data);
          setSelectedPlanId(data[0].id);
        }
      });
  }, [gymId]);

  const handleSave = async () => {
    setError('');
    const trimmedName  = fullName.trim();
    const trimmedPhone = phone.trim().replace(/\s+/g, '');

    if (!trimmedName)               { setError('Member name is required.'); return; }
    if (!trimmedPhone)              { setError('Phone number is required.'); return; }
    if (!PHONE_RE.test(trimmedPhone)){ setError('Enter a valid phone number (10–15 digits).'); return; }
    if (dob && !DOB_RE.test(dob))   { setError('Date of birth must be DD/MM/YYYY.'); return; }
    if (!gymId)                     { setError('No gym found. Please try again.'); return; }

    Keyboard.dismiss();
    setSaving(true);
    try {
      // create-gym-user edge function creates the Auth user, inserts into members table,
      // and sends the WhatsApp welcome message — same as when owner adds a member.
      // NOTE: trainer_id is intentionally NOT set here. Adding a member through the trainer
      // screen does not auto-assign that trainer to the member.
      const { data: credData, error: credError } = await supabase.functions.invoke('create-gym-user', {
        body: {
          role: 'member', gymId, fullName: trimmedName,
          extraData: {
            phone: trimmedPhone, email: email.trim() || null,
            gender, date_of_birth: dob ? parseDob(dob) : null,
            height_cm: height ? parseFloat(height) : null,
            weight_kg: weight ? parseFloat(weight) : null,
            goal, emergency_contact_name: emergencyName.trim() || null,
            emergency_contact_phone: emergencyPhone.trim() || null,
            notes: notes.trim() || null, created_by: profile?.id,
          },
        },
      });

      if (credError || !credData?.userId) {
        setError(credError?.message ?? 'Failed to create member. Try again.');
        return;
      }

      // Assign selected membership plan
      if (selectedPlanId) {
        const plan = plans.find(p => p.id === selectedPlanId);
        if (plan) {
          const { data: memberRow } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', credData.userId)
            .eq('gym_id', gymId)
            .maybeSingle();

          const memberId = memberRow?.id ?? credData.userId;
          const startDate = new Date().toISOString().split('T')[0];
          const endDate   = new Date(Date.now() + plan.duration_days * 86_400_000).toISOString().split('T')[0];

          const { error: planError } = await supabase.from('member_plans').insert({
            member_id:  memberId,
            gym_id:     gymId,
            plan_id:    selectedPlanId,
            start_date: startDate,
            end_date:   endDate,
            status:     'active',
            created_by: profile?.id ?? null,
          });
          if (planError) throw new Error(`Member created but plan assignment failed: ${planError.message}`);
        }
      }

      // Send WhatsApp welcome message (fire-and-forget)
      if (trimmedPhone) {
        supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'welcome',
            phone: trimmedPhone,
            gym_id: gymId,
            data: {
              member_name: trimmedName,
              gym_name: gymProfile?.name ?? 'Your Gym',
              member_code: credData.code,
              member_password: credData.password,
            },
          },
        }).catch(() => {});
      }

      setCredentials({ code: credData.code, password: credData.password, name: trimmedName, phone: trimmedPhone });
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Member' }} />

      {/* ── Success Modal ── */}
      <Modal visible={!!credentials} transparent animationType="fade">
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <LinearGradient
              colors={[Colors.green + '18', 'transparent']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              pointerEvents="none"
            />
            <View style={s.modalTopLine} />

            <View style={s.modalIconWrap}>
              <View style={s.modalIconBg}>
                <MaterialCommunityIcons name="check-circle-outline" size={34} color={Colors.green} />
              </View>
            </View>

            <Text style={s.modalTitle}>Member Added!</Text>
            <Text style={s.modalSub}>Share these login credentials with{'\n'}{credentials?.name}</Text>

            <View style={s.credCard}>
              <View style={s.credRow}>
                <Text style={s.credLabel}>MEMBER ID</Text>
                <Text style={s.credValue}>{credentials?.code}</Text>
              </View>
              <View style={s.credDivider} />
              <View style={s.credRow}>
                <Text style={s.credLabel}>PASSWORD</Text>
                <Text style={s.credValue}>{credentials?.password}</Text>
              </View>
            </View>

            <View style={s.warningRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.orange} />
              <Text style={s.warningText}>Screenshot or write this down — the member uses these to log in.</Text>
            </View>

            {/* Share credentials via the trainer's own WhatsApp (no Meta template needed) */}
            <AnimatedPressable
              style={s.modalShareBtn}
              scaleDown={0.97}
              onPress={() => {
                if (!credentials) return;
                const gymName = gymProfile?.name ?? 'our gym';
                const msg =
                  `Hi ${credentials.name}! Welcome to ${gymName}. 🎉\n\n` +
                  `Here are your GymSetu app login details:\n` +
                  `Member ID: ${credentials.code}\n` +
                  `Password: ${credentials.password}\n\n` +
                  `Download GymSetu, choose "Member", and log in with these. See you at the gym! 💪`;
                const digits = credentials.phone.replace(/\D/g, '');
                const to = digits.length === 10 ? `91${digits}` : digits;
                Linking.openURL(`https://wa.me/${to}?text=${encodeURIComponent(msg)}`).catch(() => {});
              }}
            >
              <View style={s.modalShareInner}>
                <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                <Text style={s.modalShareText}>SHARE ON WHATSAPP</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.modalDoneBtn}
              scaleDown={0.97}
              onPress={() => { setCredentials(null); router.back(); }}
            >
              <LinearGradient
                colors={[Colors.accent, '#C55A00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.modalDoneBtnInner}
              >
                <Text style={s.modalDoneBtnText}>DONE</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info banner — trainer context ── */}
        <FadeInView delay={0}>
          <View style={s.infoBanner}>
            <MaterialCommunityIcons name="information-outline" size={15} color="#3B82F6" />
            <Text style={s.infoText}>
              Member will be added to your gym and appear in the owner's member list.
              No trainer will be auto-assigned.
            </Text>
          </View>
        </FadeInView>

        {/* ── Error ── */}
        {!!error && (
          <FadeInView delay={0}>
            <View style={s.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          </FadeInView>
        )}

        {/* ── Personal Info ── */}
        <FadeInView delay={0}>
          <SectionCard icon="account-outline" iconColor={Colors.accent} title="PERSONAL INFO">
            <Field
              icon="account-outline"
              label="Full Name"
              required
              value={fullName}
              onChange={(v: string) => { setFullName(v); setError(''); }}
              placeholder="Enter full name"
            />
            <Field
              icon="phone-outline"
              label="Phone Number"
              required
              value={phone}
              onChange={(v: string) => { setPhone(v); setError(''); }}
              keyboardType="phone-pad"
              placeholder="10-digit mobile number"
            />
            <Field
              icon="email-outline"
              label="Email Address"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Optional"
            />
            <View style={s.fieldBlock}>
              <Text style={s.fieldBlockLabel}>GENDER</Text>
              <PillSelector
                value={gender}
                onChange={setGender}
                options={[
                  { value: 'male',   label: 'Male',   icon: 'gender-male'       },
                  { value: 'female', label: 'Female', icon: 'gender-female'     },
                  { value: 'other',  label: 'Other',  icon: 'gender-non-binary' },
                ]}
              />
            </View>
            <Field
              icon="cake-variant-outline"
              label="Date of Birth"
              value={dob}
              onChange={(v: string) => { setDob(v); setError(''); }}
              keyboardType="numeric"
              placeholder="DD/MM/YYYY"
            />
          </SectionCard>
        </FadeInView>

        {/* ── Body Metrics ── */}
        <FadeInView delay={80}>
          <SectionCard icon="human-male-height" iconColor="#3B82F6" title="BODY METRICS">
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field
                  icon="human-male-height"
                  label="Height"
                  value={height}
                  onChange={setHeight}
                  keyboardType="numeric"
                  placeholder="cm"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  icon="weight-kilogram"
                  label="Weight"
                  value={weight}
                  onChange={setWeight}
                  keyboardType="numeric"
                  placeholder="kg"
                />
              </View>
            </View>
            <View style={s.fieldBlock}>
              <Text style={s.fieldBlockLabel}>FITNESS GOAL</Text>
              <PillSelector
                value={goal}
                onChange={setGoal}
                options={[
                  { value: 'weight_loss',     label: 'Lose Weight', icon: 'trending-down'    },
                  { value: 'muscle_gain',     label: 'Gain Muscle', icon: 'arm-flex-outline' },
                  { value: 'general_fitness', label: 'Stay Fit',    icon: 'run'              },
                  { value: 'other',           label: 'Other',       icon: 'dots-horizontal'  },
                ]}
              />
            </View>
          </SectionCard>
        </FadeInView>

        {/* ── Emergency Contact ── */}
        <FadeInView delay={160}>
          <SectionCard icon="shield-account-outline" iconColor={Colors.orange} title="EMERGENCY CONTACT">
            <Field
              icon="account-outline"
              label="Contact Name"
              value={emergencyName}
              onChange={setEmergencyName}
              placeholder="Full name"
            />
            <Field
              icon="phone-outline"
              label="Contact Phone"
              value={emergencyPhone}
              onChange={setEmergencyPhone}
              keyboardType="phone-pad"
              placeholder="10-digit number"
            />
          </SectionCard>
        </FadeInView>

        {/* ── Membership Plan ── */}
        <FadeInView delay={200}>
          <SectionCard icon="card-account-details-outline" iconColor={Colors.green} title="MEMBERSHIP PLAN">
            {plans.length === 0 ? (
              <Text style={s.noPlanTxt}>No active plans found. Ask the owner to create plans first.</Text>
            ) : (
              <View style={s.planGrid}>
                {plans.map(plan => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <Pressable
                      key={plan.id}
                      style={[s.planCard, active && s.planCardActive]}
                      onPress={() => setSelectedPlanId(plan.id)}
                    >
                      {active && (
                        <LinearGradient
                          colors={[Colors.green + '18', 'transparent']}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                      )}
                      <View style={s.planCardTop}>
                        <MaterialCommunityIcons
                          name={active ? 'check-circle' : 'circle-outline'}
                          size={16}
                          color={active ? Colors.green : Colors.textMuted}
                        />
                        <Text style={[s.planName, active && s.planNameActive]} numberOfLines={1}>
                          {plan.name}
                        </Text>
                      </View>
                      <Text style={[s.planPrice, active && s.planPriceActive]}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </Text>
                      <Text style={s.planDuration}>{plan.duration_days} days</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </SectionCard>
        </FadeInView>

        {/* ── Notes ── */}
        <FadeInView delay={280}>
          <SectionCard icon="note-text-outline" iconColor="#8B5CF6" title="NOTES">
            <NoteArea value={notes} onChange={setNotes} />
          </SectionCard>
        </FadeInView>

        {/* ── Save button ── */}
        <FadeInView delay={360}>
          <AnimatedPressable
            style={[s.savePressable, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            scaleDown={0.97}
          >
            <LinearGradient
              colors={[Colors.accent, '#C55A00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.saveBtn}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
                  <Text style={s.saveBtnText}>ADD MEMBER</Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 16, paddingTop: 12 },

  infoBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             10,
    backgroundColor: '#3B82F614',
    borderWidth:     1,
    borderColor:     '#3B82F630',
    borderRadius:    14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom:    12,
  },
  infoText: { fontFamily: Fonts.regular, fontSize: 12, color: '#3B82F6', flex: 1, lineHeight: 18 },

  errorBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: Colors.red + '14',
    borderWidth:     1,
    borderColor:     Colors.red + '35',
    borderRadius:    14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom:    12,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.red, flex: 1, lineHeight: 18 },

  fieldBlock:      { gap: 8 },
  fieldBlockLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.8 },

  row: { flexDirection: 'row', gap: 10 },

  savePressable: { marginTop: 4 },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 18, minHeight: 58 },
  saveBtnText:   { fontFamily: Fonts.bold, fontSize: 15, color: '#fff', letterSpacing: 2 },

  noPlanTxt: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  planGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planCard:  {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.bgElevated,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 12, gap: 4, overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.green + '55' },
  planCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planName:       { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSub, flex: 1 },
  planNameActive: { color: Colors.text },
  planPrice:      { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.textSub },
  planPriceActive:{ color: Colors.green },
  planDuration:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius:    24,
    padding:         24,
    width:           '100%',
    borderWidth:     1,
    borderColor:     Colors.glassBorder,
    gap:             12,
    overflow:        'hidden',
  },
  modalTopLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  modalIconWrap: { alignItems: 'center', marginBottom: 4 },
  modalIconBg: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: Colors.green + '16',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.green + '35',
  },
  modalTitle: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, textAlign: 'center', letterSpacing: 0.5 },
  modalSub:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  credCard:    { backgroundColor: Colors.bgElevated, borderRadius: 16, borderWidth: 1, borderColor: Colors.accent + '28', overflow: 'hidden', marginTop: 4 },
  credRow:     { padding: 16, gap: 5 },
  credDivider: { height: 1, backgroundColor: Colors.border },
  credLabel:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 2 },
  credValue:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.accent, letterSpacing: 2 },

  warningRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.orange + '0E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.orange + '20' },
  warningText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.orange, flex: 1, lineHeight: 17 },

  modalShareBtn:   { marginBottom: 10 },
  modalShareInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    borderRadius: 14, paddingVertical: 15, backgroundColor: '#25D366',
  },
  modalShareText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.5 },

  modalDoneBtn:      { marginTop: 4 },
  modalDoneBtnInner: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  modalDoneBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 2 },
});
