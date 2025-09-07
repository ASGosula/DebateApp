import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../constants/firebase';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Animated, Modal, TextInput, Alert, ActivityIndicator, Keyboard, Platform, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function IndexRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addAnnouncementVisible, setAddAnnouncementVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStatus, setUserStatus] = useState<'pending' | 'approved' | 'rejected' | 'waitlist' | null>(null);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const slideAnim = useState(new Animated.Value(-width))[0];
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [addTournamentVisible, setAddTournamentVisible] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: '', date: '', location: '', registrationDeadline: '' });
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setChecking(false);
        router.replace('/welcome' as any);
        return;
      }
      // Load user role/status from Firestore
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data() as any;
        const email = (firebaseUser.email || '').toLowerCase();
        const seedAdmin = email === 'asgosula@gmail.com';
        const admin = data?.isAdmin === true || seedAdmin === true;
        const status = (data?.status as any) || (seedAdmin ? 'approved' : 'pending');
        setIsAdmin(!!admin);
        setUserStatus(status);
      } catch {
        setIsAdmin(false);
        setUserStatus('pending');
      } finally {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Firestore announcements sync
  useEffect(() => {
    setLoadingAnnouncements(true);
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoadingAnnouncements(false);
    });
    return () => unsub();
  }, []);

  // Firestore tournaments sync
  useEffect(() => {
    setLoadingTournaments(true);
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoadingTournaments(false);
    });
    return () => unsub();
  }, []);

  if (checking) return null;
  if (!user) return null;

  // Gate by status
  if (userStatus === 'pending') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 10 }}>Account Pending Approval</Text>
        <Text style={{ color: '#555', textAlign: 'center' }}>An admin needs to approve your account. Please check back later.</Text>
      </View>
    );
  }
  if (userStatus === 'waitlist') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 10 }}>Waitlisted</Text>
        <Text style={{ color: '#555', textAlign: 'center' }}>Your account is on the waitlist. An admin may admit you soon.</Text>
      </View>
    );
  }
  if (userStatus === 'rejected') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 10, color: '#E20000' }}>Access Denied</Text>
        <Text style={{ color: '#555', textAlign: 'center' }}>Your account request was rejected. Contact an admin if this is an error.</Text>
      </View>
    );
  }

  // Menu logic
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
    router.push(route as any);
  };

  // Add announcement
  const addAnnouncement = async () => {
    if (!isAdmin) {
      Alert.alert('Not authorized', 'Only admins can add announcements.');
      return;
    }
    if (newAnnouncementTitle.trim() === '' || newAnnouncementContent.trim() === '') {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        title: newAnnouncementTitle.trim(),
        content: newAnnouncementContent.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setAddAnnouncementVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to add announcement.');
    }
  };

  // Remove announcement
  const removeAnnouncement = async (id: string) => {
    if (!isAdmin) return;
    Alert.alert(
      'Remove Announcement',
      'Are you sure you want to remove this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'announcements', id));
            } catch {
              Alert.alert('Error', 'Failed to delete announcement.');
            }
          }
        }
      ]
    );
  };

  const addTournament = async () => {
    if (!isAdmin) {
      Alert.alert('Not authorized', 'Only admins can add tournaments.');
      return;
    }
    if (!newTournament.name || !newTournament.date || !newTournament.location || !newTournament.registrationDeadline) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...newTournament,
        createdAt: new Date().toISOString(),
      });
      setNewTournament({ name: '', date: '', location: '', registrationDeadline: '' });
      setAddTournamentVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to add tournament.');
    }
  };

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
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('/scores')}
            >
              <Text style={styles.menuItemText}>📈 Scores</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => navigateTo('/admin')}
              >
                <Text style={styles.menuItemText}>🛡️ Admin</Text>
              </TouchableOpacity>
            )}
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}
            >
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
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Add Tournament Modal */}
      <Modal
        visible={addTournamentVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddTournamentVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New Tournament</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tournament Name"
                  value={newTournament.name}
                  onChangeText={text => setNewTournament({ ...newTournament, name: text })}
                  maxLength={100}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date(s) (e.g. April 15-16, 2024)"
                  value={newTournament.date}
                  onChangeText={text => setNewTournament({ ...newTournament, date: text })}
                  maxLength={100}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Location"
                  value={newTournament.location}
                  onChangeText={text => setNewTournament({ ...newTournament, location: text })}
                  maxLength={100}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Registration Deadline"
                  value={newTournament.registrationDeadline}
                  onChangeText={text => setNewTournament({ ...newTournament, registrationDeadline: text })}
                  maxLength={100}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setAddTournamentVisible(false);
                      setNewTournament({ name: '', date: '', location: '', registrationDeadline: '' });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.addButton]}
                    onPress={addTournament}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
          <View style={styles.sectionHeaderColumn}>
            <Text style={styles.sectionTitle}>📢 News & Announcements</Text>
            <View style={styles.addButtonWrapperCentered}>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setAddAnnouncementVisible(true)}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {loadingAnnouncements ? (
            <ActivityIndicator color={BUTTON_COLOR} />
          ) : announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No announcements yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap &quot;Add&quot; to create your first announcement</Text>
            </View>
          ) : (
            announcements.map((item) => (
              <View key={item.id} style={styles.newsCard}>
                <View style={styles.newsHeader}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  {isAdmin && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeAnnouncement(item.id)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.newsContent}>{item.content}</Text>
                <Text style={styles.newsDate}>{item.createdAt?.split('T')[0]}</Text>
              </View>
            ))
          )}
        </View>
        {/* Upcoming Tournaments Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>🏆 Upcoming Tournaments</Text>
            {isAdmin ? (
              <TouchableOpacity style={styles.addButton} onPress={() => setAddTournamentVisible(true)}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {loadingTournaments ? (
            <ActivityIndicator color={BUTTON_COLOR} />
          ) : tournaments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tournaments yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap &quot;Add&quot; to create your first tournament</Text>
            </View>
          ) : (
            tournaments.map((tournament) => (
              <View key={tournament.id} style={styles.tournamentCard}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentDate}>📅 {tournament.date}</Text>
                <Text style={styles.tournamentLocation}>📍 {tournament.location}</Text>
                <Text style={styles.tournamentDeadline}>⏰ Registration Deadline: {tournament.registrationDeadline}</Text>
              </View>
            ))
          )}
        </View>
        {/* Quick Access Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Access</Text>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/lincoln-douglas' as any)}
          >
            <Text style={styles.quickButtonText}>Lincoln Douglas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/public-forum' as any)}
          >
            <Text style={styles.quickButtonText}>Public Forum</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/congress' as any)}
          >
            <Text style={styles.quickButtonText}>Congress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/policy' as any)}
          >
            <Text style={styles.quickButtonText}>Policy</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 41, // Same width as menu button for centering
  },
  menuButton: {
    padding: 10,
  },
  hamburgerLine: {
    height: 3,
    width: 25,
    backgroundColor: '#333',
    marginVertical: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  menuLogo: {
    width: 100,
    height: 50,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#222',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    elevation: 2,
    shadowColor: BUTTON_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
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
  section: {
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  addButtonWrapper: {
    flexShrink: 0,
    marginLeft: 8,
  },
  addButtonWrapperCentered: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  sectionHeaderColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#E20000',
  },
  newsContent: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  tournamentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  tournamentLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  tournamentDeadline: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
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
