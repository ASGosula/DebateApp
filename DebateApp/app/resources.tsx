import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
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
      category: "Rules"
    },
    {
      id: 2,
      title: "Research Databases",
      description: "Access to academic databases and research tools",
      category: "Research"
    },
    {
      id: 3,
      title: "Sample Cases",
      description: "Example cases and arguments for practice",
      category: "Examples"
    },
    {
      id: 4,
      title: "Video Tutorials",
      description: "Instructional videos on debate techniques",
      category: "Learning"
    },
    {
      id: 5,
      title: "Tournament Calendar",
      description: "Upcoming tournaments and registration information",
      category: "Events"
    },
    {
      id: 6,
      title: "Team Directory",
      description: "Contact information for debate teams and coaches",
      category: "Contacts"
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
            <TouchableOpacity key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceCategory}>{resource.category}</Text>
              </View>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>National Speech & Debate Association</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Debate Central</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton}>
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
  resourcesGrid: {
    marginBottom: 30,
  },
  resourceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceHeader: {
    marginBottom: 10,
  },
  resourceCategory: {
    fontSize: 12,
    color: '#E20000',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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