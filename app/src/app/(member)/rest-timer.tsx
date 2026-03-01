                                                                  
  import { useState, useEffect, useRef } from 'react';               import { View, Text, StyleSheet, ScrollView, Vibration } from    
  'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  const presets = [
    { label: '30s', seconds: 30, emoji: '⚡', desc: 'Light sets' },
    { label: '1 min', seconds: 60, emoji: '🏃', desc: 'Moderate' },
    { label: '90s', seconds: 90, emoji: '💪', desc: 'Compound' },  
    { label: '2 min', seconds: 120, emoji: '🏋️', desc: 'Heavy  lifts' },
    { label: '3 min', seconds: 180, emoji: '💀', desc: 'Max effort'
   },
  ];

  export default function RestTimerScreen() {
    const [total, setTotal] = useState(60);
    const [remaining, setRemaining] = useState(60);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
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
      setTotal(seconds);
      setRemaining(seconds);
      setRunning(false);
      setDone(false);
    };

    const toggleTimer = () => {
      if (done) {
        setRemaining(total);
        setDone(false);
        setRunning(true);
      } else {
        setRunning(prev => !prev);
      }
    };

    const reset = () => {
      clearInterval(intervalRef.current!);
      setRemaining(total);
      setRunning(false);
      setDone(false);
    };

    const percent = total > 0 ? (remaining / total) * 100 : 0;     
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    // Ring color
    const ringColor = done ? Colors.green : running ? Colors.accent
   : Colors.textMuted;

    return (
      <>
        <Stack.Screen options={{ title: '⏱️ Rest Timer' }} />      
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Timer Ring */}
          <FadeInView delay={0}>
            <View style={styles.ringContainer}>
              {/* Outer ring background */}
              <View style={[styles.ringOuter, { borderColor:       
  Colors.border }]}>
                {/* Colored ring fill using border trick */}       
                <View style={[styles.ringFill, {
                  borderColor: ringColor,
                  opacity: percent / 100,
                }]} />
                {/* Inner circle */}
                <View style={styles.ringInner}>
                  {done ? (
                    <>
                      <Text style={styles.doneEmoji}>✅</Text>     
                      <Text style={[styles.timerText, { color:     
  Colors.green }]}>Done!</Text>
                      <Text style={styles.timerSub}>Rest
  complete</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.timerText, { color:     
  ringColor }]}>
                        {String(mins).padStart(2,
  '0')}:{String(secs).padStart(2, '0')}
                      </Text>
                      <Text style={styles.timerSub}>{running ?     
  'resting...' : 'ready'}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Controls */}
          <FadeInView delay={100}>
            <View style={styles.controlRow}>
              <AnimatedPressable style={styles.resetBtn}
  scaleDown={0.9} onPress={reset}>
                <Text style={styles.resetText}>↺ Reset</Text>      
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.playBtn, { backgroundColor: done ?  
  Colors.green : running ? Colors.red : Colors.accent }]}
                scaleDown={0.94}
                onPress={toggleTimer}
              >
                <Text style={styles.playText}>
                  {done ? '🔁 Restart' : running ? '⏸ Pause' : '▶  Start'}
                </Text>
              </AnimatedPressable>

              <AnimatedPressable style={styles.resetBtn}
  scaleDown={0.9} onPress={() => selectPreset(total)}>
                <Text style={styles.resetText}>+30s</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Add 30s quick button */}
          <FadeInView delay={140}>
            <AnimatedPressable
              style={styles.addTimeBtn}
              scaleDown={0.97}
              onPress={() => {
                setRemaining(prev => prev + 30);
                if (!running) setTotal(prev => prev + 30);
              }}
            >
              <Text style={styles.addTimeText}>➕ Add 30
  seconds</Text>
            </AnimatedPressable>
          </FadeInView>

          {/* Presets */}
          <FadeInView delay={200}>
            <Text style={styles.sectionTitle}>⚡ Quick
  Presets</Text>
            <View style={styles.presetGrid}>
              {presets.map(p => {
                const active = total === p.seconds;
                return (
                  <AnimatedPressable
                    key={p.label}
                    style={[styles.presetCard, active && {
  borderColor: Colors.accent, backgroundColor: Colors.accentMuted  
  }]}
                    scaleDown={0.95}
                    onPress={() => selectPreset(p.seconds)}        
                  >
                    <Text
  style={styles.presetEmoji}>{p.emoji}</Text>
                    <Text style={[styles.presetLabel, active && {  
  color: Colors.accent }]}>{p.label}</Text>
                    <Text style={styles.presetDesc}>{p.desc}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </FadeInView>

          {/* Tips */}
          <FadeInView delay={300}>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Rest Time
  Guide</Text>
              {[
                { emoji: '⚡', tip: '30-60s — Isolation / light  sets (curls, flyes)' },
                { emoji: '💪', tip: '60-90s — Moderate compound(rows, press)' },
                { emoji: '🏋️', tip: '2-3 min — Heavy compound(squat, deadlift)' },
                { emoji: '😴', tip: 'More rest = more strength recovery per set' },
              ].map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipEmoji}>{t.emoji}</Text>   
                  <Text style={styles.tipText}>{t.tip}</Text>      
                </View>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 16, alignItems: 'center' },       

    ringContainer: { alignItems: 'center', justifyContent:
  'center', paddingVertical: 16 },
    ringOuter: {
      width: 220, height: 220, borderRadius: 110,
      borderWidth: 12, justifyContent: 'center', alignItems:       
  'center',
    },
    ringFill: {
      position: 'absolute', width: 220, height: 220,
      borderRadius: 110, borderWidth: 12,
    },
    ringInner: { alignItems: 'center', gap: 4 },
    doneEmoji: { fontSize: 40 },
    timerText: { fontSize: 52, fontWeight: '700', letterSpacing: 2 
  },
    timerSub: { fontSize: 14, color: Colors.textMuted, fontWeight: 
  '500' },

    controlRow: { flexDirection: 'row', alignItems: 'center', gap: 
  16, width: '100%', justifyContent: 'center' },
    resetBtn: {
      paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12,
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border,
    },
    resetText: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    playBtn: { paddingHorizontal: 36, paddingVertical: 16,
  borderRadius: 16 },
    playText: { fontSize: 16, fontWeight: '700', color: '#FFF' },  

    addTimeBtn: {
      width: '100%', paddingVertical: 12, borderRadius: 12,        
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border,
      alignItems: 'center',
    },
    addTimeText: { fontSize: 14, fontWeight: '600', color:
  Colors.textSub },

    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text, alignSelf: 'flex-start' },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, 
  width: '100%' },
    presetCard: {
      width: '18%', minWidth: 58, alignItems: 'center', gap: 4,    
      backgroundColor: Colors.bgCard, borderRadius: 12,
  paddingVertical: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    presetEmoji: { fontSize: 20 },
    presetLabel: { fontSize: 13, fontWeight: '700', color:
  Colors.text },
    presetDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 
  'center' },

    tipsCard: { width: '100%', backgroundColor: Colors.bgCard,     
  borderRadius: 14, padding: 14, borderWidth: 1, borderColor:      
  Colors.border, gap: 10 },
    tipsTitle: { fontSize: 14, fontWeight: '700', color:
  Colors.text },
    tipRow: { flexDirection: 'row', gap: 10, alignItems:
  'flex-start' },
    tipEmoji: { fontSize: 16, width: 22 },
    tipText: { flex: 1, fontSize: 13, color: Colors.textSub,       
  lineHeight: 19 },
  });
