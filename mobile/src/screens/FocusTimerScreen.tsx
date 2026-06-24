/**
 * FocusTimerScreen — Issue #824
 * Pomodoro-style focus timer with bounty association, haptic alerts,
 * phase auto-advancement, and session history.
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme/tokens';
import { FocusSession } from '../types';
import { FocusPhase, PHASE_DURATION, useFocusTimer } from '../hooks/useFocusTimer';

// ─── Mock bounties ────────────────────────────────────────────────────────────

const MOCK_BOUNTIES = [
  { id: '1', title: 'DeFi Dashboard UI' },
  { id: '2', title: 'Smart Contract Audit' },
  { id: '3', title: 'Mobile Wallet Design' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function phaseLabel(phase: FocusPhase): string {
  if (phase === 'focus') return '🍅 Focus';
  if (phase === 'short-break') return '☕ Short Break';
  return '🌿 Long Break';
}

function phaseColor(phase: FocusPhase, primary: string, success: string, accent: string): string {
  if (phase === 'focus') return primary;
  if (phase === 'short-break') return success;
  return accent;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FocusTimerScreen() {
  const { colors, isDark } = useTheme();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [showBountyPicker, setShowBountyPicker] = useState(false);

  const handleSessionComplete = useCallback(
    (session: FocusSession) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSessions((prev) => [{ ...session, bountyId: selectedBountyId }, ...prev]);
    },
    [selectedBountyId],
  );

  const { phase, timeLeft, isRunning, pomodoroCount, start, pause, reset } =
    useFocusTimer(handleSessionComplete);

  const color = phaseColor(phase, colors.primary, colors.success ?? '#22c55e', colors.accent);
  const totalSeconds = PHASE_DURATION[phase];
  const progress = (totalSeconds - timeLeft) / totalSeconds; // 0→1
  const selectedBounty = MOCK_BOUNTIES.find((b) => b.id === selectedBountyId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={[styles.heading, { color: colors.text }]}>Focus Mode</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {phaseLabel(phase)}
        </Text>

        {/* Circular timer */}
        <View style={styles.timerWrapper}>
          <View style={[styles.timerRing, { borderColor: color + '30' }]}>
            <View style={[styles.timerInner, { borderColor: color }]}>
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={[styles.timerPhase, { color }]}>{phaseLabel(phase)}</Text>
            </View>
          </View>
          {/* Progress arc indicator (simple fill bar underneath) */}
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressFill, { backgroundColor: color, width: `${Math.round(progress * 100)}%` }]}
            />
          </View>
        </View>

        {/* Pomodoro dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < pomodoroCount % 4 ? color : colors.border,
                  borderColor: color,
                },
              ]}
            />
          ))}
          <Text style={[styles.pomodoroCount, { color: colors.textSecondary }]}>
            {pomodoroCount} completed
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={isRunning ? pause : start}
            style={[styles.primaryBtn, { backgroundColor: color }]}
            accessibilityRole="button"
            accessibilityLabel={isRunning ? 'Pause timer' : 'Start timer'}
          >
            <Text style={styles.primaryBtnText}>{isRunning ? '⏸ Pause' : '▶ Start'}</Text>
          </Pressable>
          <Pressable
            onPress={reset}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>↺ Reset</Text>
          </Pressable>
        </View>

        {/* Bounty selector */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Active Bounty</Text>
          <Pressable
            onPress={() => setShowBountyPicker((v) => !v)}
            style={[styles.bountySelector, { borderColor: colors.border }]}
            accessibilityRole="combobox"
            accessibilityLabel="Select bounty"
          >
            <Text style={{ color: selectedBounty ? colors.text : colors.textSecondary }}>
              {selectedBounty ? selectedBounty.title : 'Select a bounty…'}
            </Text>
            <Text style={{ color: colors.textSecondary }}>{showBountyPicker ? '▲' : '▼'}</Text>
          </Pressable>

          {showBountyPicker && (
            <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable
                onPress={() => { setSelectedBountyId(null); setShowBountyPicker(false); }}
                style={styles.dropdownItem}
              >
                <Text style={{ color: colors.textSecondary }}>None</Text>
              </Pressable>
              {MOCK_BOUNTIES.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => { setSelectedBountyId(b.id); setShowBountyPicker(false); }}
                  style={[
                    styles.dropdownItem,
                    b.id === selectedBountyId && { backgroundColor: color + '18' },
                  ]}
                >
                  <Text style={{ color: b.id === selectedBountyId ? color : colors.text }}>
                    {b.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Session history */}
        {sessions.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Session History</Text>
            {sessions.slice(0, 5).map((s) => {
              const bountyName = MOCK_BOUNTIES.find((b) => b.id === s.bountyId)?.title ?? 'No bounty';
              const mins = Math.round(s.durationSeconds / 60);
              return (
                <View key={s.id} style={[styles.sessionRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ fontSize: 18 }}>{s.phase === 'focus' ? '🍅' : '☕'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionLabel, { color: colors.text }]}>
                      {phaseLabel(s.phase)} — {mins}m
                    </Text>
                    <Text style={[styles.sessionSub, { color: colors.textSecondary }]}>
                      {bountyName} · {new Date(s.completedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.md },
  heading: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, textAlign: 'center', marginTop: 2 },

  timerWrapper: { alignItems: 'center', gap: Spacing.sm },
  timerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  timerInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timerText: { fontSize: 52, fontWeight: FontWeight.bold, fontVariant: ['tabular-nums'] },
  timerPhase: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  progressBar: {
    width: 220,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pomodoroCount: { fontSize: FontSize.xs, marginLeft: Spacing.xs },

  controls: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  primaryBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  secondaryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },

  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },

  bountySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dropdown: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sessionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  sessionSub: { fontSize: FontSize.xs, marginTop: 1 },
});
