// In screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
// --- Import Platform and Alert ---
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, Linking, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
// --- Import updateDoc ---
import { doc, onSnapshot, collection, updateDoc } from 'firebase/firestore';

// --- IMPORTS ---
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
// --- NEW IMPORTS FOR NOTIFICATIONS ---
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// --- NEW NOTIFICATION HANDLER CONFIG ---
// This ensures the app shows an alert even when it's in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DashboardScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSemester, setUserSemester] = useState(null);
  const insets = useSafeAreaInsets();

  // --- NEW useEffect FOR PUSH NOTIFICATIONS ---
  useEffect(() => {
    // This function will get the token and save it to Firestore
    const registerForPushNotificationsAsync = async () => {
      // Must use a physical device for Push Notifications
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device, not an emulator.");
        return;
      }
      
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If not granted, ask the user
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'You will not receive notifications for class cancellations or events.');
        return;
      }
      
      // Get the Expo Push Token
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          // --- THIS IS CRITICAL ---
          // Find this value in your app.json file under 'expo.extra.eas.projectId'
          projectId: '13b3c38e-b18f-41e2-bc64-a7f64cc7071c', 
        });
        const token = tokenData.data;
        console.log("Got user's push token:", token);

        // Save the token to the user's Firestore document
        if (token && auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            pushToken: token, // Save the token
          });
          console.log("Push token saved to Firestore.");
        }
      } catch (e) {
        console.error("Failed to get push token:", e);
        Alert.alert("Error", "Failed to register for push notifications.");
      }
    };

    // We only want to run this *after* we know who the user is
    if (auth.currentUser) {
      registerForPushNotificationsAsync();
    }
  }, [auth.currentUser]); // Runs when the user logs in

  // (useEffect hooks for user semester and courses remain the same)
  useEffect(() => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserSemester(doc.data().semester);
        }
      });
      return () => unsubscribe();
    }
  }, []);
  useEffect(() => {
    if (userSemester) {
      const coursesCollectionRef = collection(db, 'semesters', userSemester, 'courses');
      const unsubscribe = onSnapshot(coursesCollectionRef, (querySnapshot) => {
        const coursesData = [];
        querySnapshot.forEach((doc) => {
          coursesData.push({ ...doc.data(), id: doc.id });
        });
        setCourses(coursesData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching courses: ", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userSemester]);

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseItem}>
      <Text style={styles.courseName}>{item.courseName}</Text>
      <Text style={styles.courseCode}>{item.courseCode}</Text>
      {item.instructor && <Text style={styles.instructor}>Instructor: {item.instructor}</Text>}
      {item.playlistUrl && (
        <View style={styles.buttonWrapper}>
          <Button title="View Playlist" onPress={() => Linking.openURL(item.playlistUrl)} color="#007AFF" />
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Academix Hub</Text>

      <View style={styles.hubGrid}>
        <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.hubCardWrapper}>
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Timetable')}
          >
            <Ionicons name="calendar-outline" size={32} color="#007AFF" />
            <Text style={styles.hubCardText}>Timetable</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
      
      <Animatable.View animation="fadeIn" delay={500} style={styles.academicSection}>
        <Text style={styles.sectionTitle}>My Courses (Semester: {userSemester})</Text>
        {loading ? <ActivityIndicator size="large" /> : (
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No courses found for your semester.</Text>}
          />
        )}
      </Animatable.View>

      {/* --- Floating Chat Button --- */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('Chat')}
      >
        <Ionicons name="chatbubbles-outline" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default DashboardScreen;

// --- STYLES (Unchanged) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
    hubGrid: { 
      flexDirection: 'row', 
      justifyContent: 'center',
      paddingHorizontal: 15, 
      marginBottom: 20 
    },
    hubCardWrapper: {
      width: '50%',
      maxWidth: 200,
    },
    hubCard: { 
      backgroundColor: '#fff', 
      padding: 20, 
      borderRadius: 12, 
      marginHorizontal: 5, 
      alignItems: 'center', 
      justifyContent: 'center', 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 4, 
      elevation: 3, 
      minHeight: 80 
    },
    hubCardText: { 
      fontWeight: '600', 
      fontSize: 16, 
      textAlign: 'center',
      marginTop: 8
    },
    academicSection: { flex: 1, backgroundColor: '#fff', marginHorizontal: 10, borderRadius: 12, padding: 15 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    courseItem: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    courseName: { fontSize: 16, fontWeight: '600' },
    courseCode: { fontSize: 14, color: '#666', marginTop: 4 },
    instructor: { fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' },
    buttonWrapper: { marginTop: 10 },
    emptyText: { textAlign: 'center', marginTop: 30, color: 'gray' },
    
    chatButton: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    }
});
