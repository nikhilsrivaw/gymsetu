import { useState, useEffect, useRef } from 'react';               import { View, Text, StyleSheet, ScrollView, Vibration } from    
  'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                                                                                   
  const presets = [                                                
    { label: '30s',   seconds: 30,  desc: 'LIGHT' },
    { label: '1 MIN', seconds: 60,  desc: 'MODERATE' },
    { label: '90s',   seconds: 90,  desc: 'COMPOUND' },
    { label: '2 MIN', seconds: 120, desc: 'HEAVY' },
    { label: '3 MIN', seconds: 180, desc: 'MAX EFFORT' },
  ];

  const tips = [
    { time: '30–60s',  desc: 'Isolation & light sets — curls,  flyes, cables' },
    { time: '60–90s',  desc: 'Moderate compound — rows, press, lunges' },
    { time: '2–3 MIN', desc: 'Heavy compound — squat, deadlift,  bench' },
    { time: 'MORE',    desc: 'More rest = more strength recovered per set' },
  ];

  export default function RestTimerScreen() {
    const [total,     setTotal]     = useState(60);
    const [remaining, setRemaining] = useState(60);
    const [running,   setRunning]   = useState(false);
    const [done,      setDone]      = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> |    
  null>(null);

    useEffect(() => {
      if (running) {
        intervalRef.current = setInterval(() => {
          setRemaining(prev => {
            if (prev <= 1) {
              clearInterval(intervalRef.current!);
              setRunning(false);
              setDone(true);
              Vibration.vibrate([0, 400, 200, 400]);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return () => { if (intervalRef.current)
  clearInterval(intervalRef.current); };
    }, [running]);

    const selectPreset = (seconds: number) => {
      clearInterval(intervalRef.current!);
      setTotal(seconds); setRemaining(seconds);
      setRunning(false); setDone(false);
    };

    const toggleTimer = () => {
      if (done) { setRemaining(total); setDone(false);
  setRunning(true); }
      else { setRunning(prev => !prev); }
    };

    const reset = () => {
      clearInterval(intervalRef.current!);
      setRemaining(total); setRunning(false); setDone(false);      
    };

    const percent  = total > 0 ? (remaining / total) * 100 : 0;    
    const mins     = Math.floor(remaining / 60);
    const secs     = remaining % 60;
    const ringColor = done ? Colors.green : running ? Colors.accent
   : Colors.textMuted;

    return (
      <>
        <Stack.Screen options={{ title: 'Rest Timer' }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Timer Display ─────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.timerCard}>
              <View style={styles.timerGlow} />

              {/* Status label */}
              <Text style={[styles.statusLabel, { color: ringColor 
  }]}>
                {done ? 'REST COMPLETE' : running ? 'RESTING...' : 
  'READY'}
              </Text>

              {/* Ring */}
              <View style={styles.ringWrap}>
                <View style={[styles.ringOuter, { borderColor:     
  Colors.border }]}>
                  <View style={[styles.ringFill, { borderColor:    
  ringColor, opacity: percent / 100 }]} />
                  <View style={styles.ringInner}>
                    {done ? (
                      <>
                        <Text style={[styles.timerNum, { color:    
  Colors.green }]}>00:00</Text>
                        <Text style={styles.timerDone}>DONE</Text> 
                      </>
                    ) : (
                      <>
                        <Text style={[styles.timerNum, { color:    
  ringColor }]}>
                          {String(mins).padStart(2,
  '0')}:{String(secs).padStart(2, '0')}
                        </Text>
                        <Text style={styles.timerTotal}>/
  {Math.floor(total / 60).toString().padStart(2,
  '0')}:{String(total % 60).padStart(2, '0')}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Segmented progress bar */}
              <View style={styles.segBar}>
                {Array.from({ length: 20 }).map((_, i) => (        
                  <View
                    key={i}
                    style={[
                      styles.seg,
                      { backgroundColor: i < Math.round(percent /  
  5) ? ringColor : Colors.border },
                    ]}
                  />
                ))}
              </View>
            </View>
          </FadeInView>

          {/* ── Controls ──────────────────────── */}
          <FadeInView delay={100}>
            <View style={styles.controlRow}>
              <AnimatedPressable style={styles.sideBtn}
  scaleDown={0.9} onPress={reset}>
                <Text style={styles.sideBtnIcon}>↺</Text>
                <Text style={styles.sideBtnText}>RESET</Text>      
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.playBtn, {
                  backgroundColor: done ? Colors.green : running ? 
  Colors.red : Colors.accent,
                }]}
                scaleDown={0.94}
                onPress={toggleTimer}
              >
                <Text style={styles.playIcon}>{done ? '↺' : running
   ? '⏸' : '▶'}</Text>
                <Text style={styles.playText}>
                  {done ? 'RESTART' : running ? 'PAUSE' : 'START'} 
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.sideBtn}
                scaleDown={0.9}
                onPress={() => {
                  setRemaining(prev => prev + 30);
                  if (!running) setTotal(prev => prev + 30);       
                }}
              >
                <Text style={styles.sideBtnIcon}>+</Text>
                <Text style={styles.sideBtnText}>+30s</Text>       
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* ── Presets ───────────────────────── */}
          <FadeInView delay={200}>
            <Text style={styles.sectionLabel}>QUICK PRESETS</Text> 
            <View style={styles.presetRow}>
              {presets.map(p => {
                const active = total === p.seconds;
                return (
                  <AnimatedPressable
                    key={p.label}
                    style={[styles.presetCard, active &&
  styles.presetCardActive]}
                    scaleDown={0.93}
                    onPress={() => selectPreset(p.seconds)}        
                  >
                    {active && <View style={styles.presetActiveDot}
   />}
                    <Text style={[styles.presetLabel, active && {  
  color: Colors.accent }]}>
                      {p.label}
                    </Text>
                    <Text style={styles.presetDesc}>{p.desc}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </FadeInView>

          {/* ── Rest Guide ────────────────────── */}
          <FadeInView delay={300}>
            <View style={styles.guideCard}>
              <Text style={styles.sectionLabel}>REST TIME
  GUIDE</Text>
              {tips.map((t, i) => (
                <View key={i} style={[styles.tipRow, i <
  tips.length - 1 && styles.tipDivider]}>
                  <View style={styles.tipTimeBadge}>
                    <Text style={styles.tipTime}>{t.time}</Text>   
                  </View>
                  <Text style={styles.tipDesc}>{t.desc}</Text>     
                </View>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 14, alignItems: 'center' },       

    // Timer card
    timerCard: {
      width: '100%', backgroundColor: Colors.bgCard,
      borderRadius: 20, padding: 24,
      borderWidth: 1, borderColor: Colors.border,
      alignItems: 'center', gap: 16, overflow: 'hidden',
    },
    timerGlow: {
      position: 'absolute', top: -40, width: 200, height: 200,     
      borderRadius: 100, backgroundColor: Colors.accentGlow,       
    },
    statusLabel: {
      fontFamily: Fonts.bold,
      fontSize: 10, letterSpacing: 2,
    },

    // Ring
    ringWrap: { alignItems: 'center', justifyContent: 'center' },  
    ringOuter: {
      width: 200, height: 200, borderRadius: 100,
      borderWidth: 10, justifyContent: 'center', alignItems:       
  'center',
    },
    ringFill: {
      position: 'absolute',
      width: 200, height: 200, borderRadius: 100, borderWidth: 10, 
    },
    ringInner: { alignItems: 'center', gap: 4 },
    timerNum: {
      fontFamily: Fonts.condensedBold,
      fontSize: 56, letterSpacing: 2,
    },
    timerTotal: {
      fontFamily: Fonts.condensedSemi,
      fontSize: 14, color: Colors.textMuted, letterSpacing: 1,     
    },
    timerDone: {
      fontFamily: Fonts.bold,
      fontSize: 16, color: Colors.green, letterSpacing: 2,
    },

    // Segmented bar
    segBar: { flexDirection: 'row', gap: 3, width: '100%' },       
    seg: { flex: 1, height: 4, borderRadius: 2 },

    // Controls
    controlRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      width: '100%', justifyContent: 'center',
    },
    sideBtn: {
      paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12,
      backgroundColor: Colors.bgCard,
      borderWidth: 1, borderColor: Colors.border,
      alignItems: 'center', gap: 2,
    },
    sideBtnIcon: {
      fontFamily: Fonts.condensedBold,
      fontSize: 18, color: Colors.text,
    },
    sideBtnText: {
      fontFamily: Fonts.bold,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8,    
    },
    playBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center',
      gap: 10, paddingVertical: 16, borderRadius: 14,
    },
    playIcon: {
      fontFamily: Fonts.condensedBold,
      fontSize: 20, color: '#FFF',
    },
    playText: {
      fontFamily: Fonts.bold,
      fontSize: 14, color: '#FFF', letterSpacing: 1,
    },

    sectionLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 8,
    },

    // Presets
    presetRow: { flexDirection: 'row', gap: 8, width: '100%' },    
    presetCard: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1, borderColor:
  Colors.border,
    },
    presetCardActive: {
      backgroundColor: Colors.accentMuted,
      borderColor: Colors.accent + '50',
    },
    presetActiveDot: {
      width: 4, height: 4, borderRadius: 2,
      backgroundColor: Colors.accent,
    },
    presetLabel: {
      fontFamily: Fonts.condensedBold,
      fontSize: 14, color: Colors.text,
    },
    presetDesc: {
      fontFamily: Fonts.medium,
      fontSize: 7, color: Colors.textMuted, letterSpacing: 0.5,    
    },

    // Guide
    guideCard: {
      width: '100%', backgroundColor: Colors.bgCard,
      borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: Colors.border, gap: 4,
    },
    tipRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingVertical: 8,
    },
    tipDivider: { borderBottomWidth: 1, borderBottomColor:
  Colors.border },
    tipTimeBadge: {
      backgroundColor: Colors.accentMuted, borderRadius: 6,        
      paddingHorizontal: 8, paddingVertical: 4, minWidth: 64,      
  alignItems: 'center',
    },
    tipTime: {
      fontFamily: Fonts.condensedBold,
      fontSize: 12, color: Colors.accent,
    },
    tipDesc: {
      flex: 1,
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textSub, lineHeight: 18,
    },
  });