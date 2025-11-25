import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, SafeAreaView, StatusBar, Platform
} from 'react-native';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL RENDER BACKEND URL
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function App() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'normal' | 'locked' | 'remedial'>('loading');

  // Form Inputs
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [focusTime, setFocusTime] = useState('');
  const [loading, setLoading] = useState(false);

  // --- POLLING LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (status === 'locked' && studentId) {
      interval = setInterval(checkStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, studentId]);

  // --- API FUNCTIONS ---
  const handleRegister = async () => {
    if (!name) return alert("Please enter your name");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.id) {
        setStudentId(data.id);
        setStatus('normal');
      }
    } catch (e) {
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`${API_URL}/status/${studentId}`);
      const data = await res.json();
      if (data.status !== status) {
        setStatus(data.status);
      }
    } catch (e) {
      console.log("Polling error", e);
    }
  };

  const submitCheckin = async () => {
    if (!score || !focusTime) return alert("Please fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/daily-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          quiz_score: parseInt(score),
          focus_minutes: parseInt(focusTime)
        })
      });
      const data = await res.json();

      if (data.status === "Pending Mentor Review") {
        setStatus('locked');
      } else {
        alert("Check-in successful! Keep it up.");
        setScore('');
        setFocusTime('');
      }
    } catch (e) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const finishTask = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/mark-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });
      setStatus('normal');
    } catch (e) {
      alert("Error completing task");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER SCREENS ---

  if (!studentId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.logoEmoji}>🎓</Text>
            <Text style={styles.mainTitle}>StudyByte</Text>
            <Text style={styles.subtitle}>Student Companion</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Get Started</Text>
            <TextInput
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Start Session</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'locked') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centerContainer, styles.lockedContainer]}>
          <View style={styles.iconCircleRed}>
            <Text style={styles.largeEmoji}>🔒</Text>
          </View >
          <Text style={styles.statusTitle}>Account Paused</Text>
          <Text style={styles.statusDescription}>
            Your performance metrics indicate you might need some help.
            A mentor has been notified.
          </Text>

          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#EF4444" />
            <Text style={styles.loaderText}>Waiting for mentor...</Text>
          </View>
        </View >
      </SafeAreaView >
    );
  }

  if (status === 'remedial') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <View style={styles.iconCircleYellow}>
            <Text style={styles.largeEmoji}>📚</Text>
          </View>
          <Text style={styles.statusTitle}>Action Required</Text>
          <Text style={styles.statusDescription}>
            Please complete the following task to unlock your dashboard.
          </Text>

          <View style={styles.taskCard}>
            <Text style={styles.taskLabel}>ASSIGNMENT</Text>
            <Text style={styles.taskTitle}>Read Chapter 4: System Design</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={finishTask}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Mark as Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Normal State
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{name}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Check-in</Text>
          <Text style={styles.sectionSubtitle}>Update your progress to stay on track.</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quiz Score (0-10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={score}
                onChangeText={setScore}
                placeholder="e.g. 8"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Focus Minutes</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={focusTime}
                onChangeText={setFocusTime}
                placeholder="e.g. 60"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={submitCheckin}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Check-in</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Keep your quiz scores above 7 to maintain access to the dashboard.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Cool Gray 50
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 24,
  },

  // Typography
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827', // Gray 900
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Gray 500
    textAlign: 'center',
  },
  headerContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  // Forms
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Gray 200
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#111827', // Gray 900
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Dashboard
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', // Green 50
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Green 500
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857', // Green 700
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF', // Blue 50
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
    fontSize: 18,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF', // Blue 800
    flex: 1,
    lineHeight: 20,
  },

  // Locked & Remedial States
  lockedContainer: {
    paddingHorizontal: 40,
  },
  iconCircleRed: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2', // Red 50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircleYellow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFBEB', // Amber 50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  largeEmoji: {
    fontSize: 48,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loaderText: {
    marginLeft: 10,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Amber 500
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  taskLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});