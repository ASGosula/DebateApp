import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function ResourcesScreen() {
  const router = useRouter();

  const resources = [
    {
      id: 1,
      title: "Debate Rules & Guidelines",
      description: "Official rules and guidelines for different debate formats",
      category: "Rules",
      url: "https://docs.google.com/document/d/1hq7-DE6ls2ryVtOttxR4BNpRdP7xUbBr0M3SMYefek8/edit?tab=t.0"
    },
    {
      id: 2,
      title: "Research Databases",
      description: "Access to academic databases and research tools",
      category: "Research"
    },
    {
      id: 5,
      title: "Tournament Calendar",
      description: "Upcoming tournaments and registration information",
      category: "Events",
      url: "https://www.tabroom.com/index/index.mhtml"
    },
    {
      id: 6,
      title: "Team Directory",
      description: "Contact information for debate teams and coaches",
      category: "Contacts",
      url: "https://slack.com"
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
        <Text style={styles.headerTitle}>Resources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image source={SCREENSHOT} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>Debate Resources</Text>
          <Text style={styles.welcomeSubtitle}>Everything you need to excel in debate</Text>
        </View>

        {/* Resources Grid */}
        <View style={styles.resourcesGrid}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => resource.url && Linking.openURL(resource.url)}
              disabled={!resource.url}
            >
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceCategory}>{resource.category}</Text>
              </View>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              {resource.title === 'Research Databases' && (
                <Text style={{ color: '#E20000', marginTop: 6, fontWeight: 'bold' }}>Work in progress</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://www.speechanddebate.org')}>
            <Text style={styles.linkButtonText}>National Speech & Debate Association</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://debate-central.ncpathinktank.org')}>
            <Text style={styles.linkButtonText}>Debate Central</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://www.youtube.com/c/NationalSpeechDebateAssociation')}>
            <Text style={styles.linkButtonText}>Debate Videos</Text>
          </TouchableOpacity>
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
    color: '#E20000',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 41,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.6,
    maxWidth: 250,
    height: 100,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resourcesGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourceCategory: {
    fontSize: 14,
    color: '#E20000',
    fontWeight: 'bold',
    marginRight: 8,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'left',
    marginBottom: 8,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  linkButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  linkButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}); 