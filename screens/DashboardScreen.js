// In screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';

// --- NEW IMPORTS ---
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const DashboardScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSemester, setUserSemester] = useState(null);
  const insets = useSafeAreaInsets();

  // (useEffect hooks remain the same...)
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

      {/* --- Main Hub Sections --- */}
      <View style={styles.hubGrid}>
        
        {/* --- "ATTENDANCE TRACKER" BUTTON IS NOW REMOVED TO FIX THE CRASH --- */}
        
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
      
      {/* --- Academic Section --- */}
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
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
    hubGrid: { 
      flexDirection: 'row', 
      justifyContent: 'center', // Center the remaining card
      paddingHorizontal: 15, 
      marginBottom: 20 
    },
    hubCardWrapper: { // New wrapper to constrain the card's size
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
      marginTop: 8 // Added space for the icon
    },
    academicSection: { flex: 1, backgroundColor: '#fff', marginHorizontal: 10, borderRadius: 12, padding: 15 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    courseItem: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    courseName: { fontSize: 16, fontWeight: '600' },
    courseCode: { fontSize: 14, color: '#666', marginTop: 4 },
    instructor: { fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' },
    buttonWrapper: { marginTop: 10 },
    emptyText: { textAlign: 'center', marginTop: 30, color: 'gray' }
});