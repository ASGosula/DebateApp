import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ScrollView,
  Animated,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width, height } = Dimensions.get('window');

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

export default function HomePage() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [addAnnouncementVisible, setAddAnnouncementVisible] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const slideAnim = useState(new Animated.Value(-width))[0];

  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "New Tournament Registration Open",
      content: "Registration for the Spring Championship is now open. Early bird pricing available until March 15th.",
      date: "2024-03-10"
    },
    {
      id: 2,
      title: "Updated Debate Rules Released",
      content: "The National Speech & Debate Association has released updated rules for the 2024-2025 season.",
      date: "2024-03-08"
    },
    {
      id: 3,
      title: "Team Meeting This Friday",
      content: "Mandatory team meeting this Friday at 3:30 PM in the debate room. New topic discussion.",
      date: "2024-03-07"
    }
  ]);

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateTo = (route: string) => {
    toggleMenu();
    if (route === '/') {
      router.push('/');
    } else if (route === '/practice') {
      router.push('/practice' as any);
    } else if (route === '/resources') {
      router.push('/resources' as any);
    }
  };

  const addAnnouncement = () => {
    if (newAnnouncementTitle.trim() === '' || newAnnouncementContent.trim() === '') {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newAnnouncement: Announcement = {
      id: Date.now(),
      title: newAnnouncementTitle.trim(),
      content: newAnnouncementContent.trim(),
      date: today
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
    setAddAnnouncementVisible(false);
  };

  const removeAnnouncement = (id: number) => {
    Alert.alert(
      'Remove Announcement',
      'Are you sure you want to remove this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setAnnouncements(announcements.filter(item => item.id !== id))
        }
      ]
    );
  };

  const tournaments = [
    {
      id: 1,
      name: "Spring Championship",
      date: "April 15-16, 2024",
      location: "University of California, Berkeley",
      registrationDeadline: "March 15, 2024"
    },
    {
      id: 2,
      name: "State Qualifiers",
      date: "May 3-4, 2024",
      location: "Stanford University",
      registrationDeadline: "April 20, 2024"
    },
    {
      id: 3,
      name: "National Tournament",
      date: "June 10-15, 2024",
      location: "Phoenix, Arizona",
      registrationDeadline: "May 1, 2024"
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header with Hamburger Menu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debate App</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Hamburger Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={toggleMenu}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.menuHeader}>
              <Image source={SCREENSHOT} style={styles.menuLogo} resizeMode="contain" />
              <Text style={styles.menuTitle}>Menu</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('/')}
            >
              <Text style={styles.menuItemText}>🏠 Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('/practice')}
            >
              <Text style={styles.menuItemText}>🎯 Practice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('/resources')}
            >
              <Text style={styles.menuItemText}>📚 Resources</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Add Announcement Modal */}
      <Modal
        visible={addAnnouncementVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddAnnouncementVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Announcement</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Announcement Title"
              value={newAnnouncementTitle}
              onChangeText={setNewAnnouncementTitle}
              maxLength={100}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Announcement Content"
              value={newAnnouncementContent}
              onChangeText={setNewAnnouncementContent}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddAnnouncementVisible(false);
                  setNewAnnouncementTitle('');
                  setNewAnnouncementContent('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={addAnnouncement}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image source={SCREENSHOT} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>Welcome to Debate App!</Text>
          <Text style={styles.welcomeSubtitle}>Your comprehensive debate companion</Text>
        </View>

        {/* News & Announcements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📢 News & Announcements</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddAnnouncementVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No announcements yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add" to create your first announcement</Text>
            </View>
          ) : (
            announcements.map((item) => (
              <View key={item.id} style={styles.newsCard}>
                <View style={styles.newsHeader}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeAnnouncement(item.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.newsContent}>{item.content}</Text>
                <Text style={styles.newsDate}>{item.date}</Text>
              </View>
            ))
          )}
        </View>

        {/* Upcoming Tournaments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Upcoming Tournaments</Text>
          {tournaments.map((tournament) => (
            <View key={tournament.id} style={styles.tournamentCard}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.tournamentDate}>📅 {tournament.date}</Text>
              <Text style={styles.tournamentLocation}>📍 {tournament.location}</Text>
              <Text style={styles.tournamentDeadline}>⏰ Registration Deadline: {tournament.registrationDeadline}</Text>
            </View>
          ))}
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Access</Text>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/lincoln-douglas')}
          >
            <Text style={styles.quickButtonText}>Lincoln Douglas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/public-forum')}
          >
            <Text style={styles.quickButtonText}>Public Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/congress')}
          >
            <Text style={styles.quickButtonText}>Congress</Text>
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
  menuButton: {
    padding: 8,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 41, // Same width as menu button for centering
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  menuHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  menuLogo: {
    width: 80,
    height: 40,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  newsCard: {
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
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  newsContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E20000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: width * 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f1f3f4',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  tournamentCard: {
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
  tournamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tournamentLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tournamentDeadline: {
    fontSize: 14,
    color: '#E20000',
    fontWeight: '600',
  },
  quickButton: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 