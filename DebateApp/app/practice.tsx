import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function PracticeScreen() {
  const router = useRouter();

  const practiceOptions = [
    {
      id: 1,
      title: "Lincoln Douglas",
      description: "One-on-one value debate format",
      icon: "⚖️",
      route: "/lincoln-douglas"
    },
    {
      id: 2,
      title: "Public Forum",
      description: "Team debate on current events",
      icon: "🏛️",
      route: "/public-forum"
    },
    {
      id: 3,
      title: "Congress",
      description: "Legislative debate simulation",
      icon: "📜",
      route: "/congress"
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image source={SCREENSHOT} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>Choose Your Practice Format</Text>
          <Text style={styles.welcomeSubtitle}>Select a debate format to begin practicing</Text>
        </View>

        {/* Practice Options */}
        <View style={styles.practiceGrid}>
          {practiceOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.practiceCard}
              onPress={() => router.push(option.route as any)}
            >
              <Text style={styles.practiceIcon}>{option.icon}</Text>
              <Text style={styles.practiceTitle}>{option.title}</Text>
              <Text style={styles.practiceDescription}>{option.description}</Text>
              <View style={styles.practiceArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Practice Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Practice Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Start with Practice Mode</Text>
            <Text style={styles.tipContent}>
              Use the practice timers to get familiar with debate timing and structure before moving to real debate mode.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Use Speaking Practice</Text>
            <Text style={styles.tipContent}>
              Practice your speaking skills with the voice meter feature to improve your delivery and confidence.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#E20000',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.5,
    maxWidth: 200,
    height: 80,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  practiceGrid: {
    marginBottom: 30,
  },
  practiceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  practiceIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  practiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    flex: 1,
  },
  practiceDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  practiceArrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 20,
    color: '#E20000',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 