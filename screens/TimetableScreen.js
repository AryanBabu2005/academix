// In screens/TimetableScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';

const TimetableScreen = () => {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSemester, setUserSemester] = useState(null);
  const insets = useSafeAreaInsets(); // Get safe area insets

  useEffect(() => {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubProfile = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) setUserSemester(doc.data().semester);
    });
    return () => unsubProfile();
  }, []);
  
  useEffect(() => {
    if (userSemester) {
      const timetableRef = collection(db, 'semesters', userSemester, 'timetable');
      const unsubscribe = onSnapshot(timetableRef, (snapshot) => {
        const schedule = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const grouped = schedule.reduce((acc, item) => {
          const day = item.dayOfWeek;
          if (!acc[day]) acc[day] = [];
          acc[day].push(item);
          acc[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
          return acc;
        }, {});
        const sections = Object.keys(grouped).map(day => ({ title: day, data: grouped[day] }));
        setTimetableData(sections);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userSemester]);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.time}>{item.startTime} - {item.endTime}</Text>
      <Text style={styles.courseName}>{item.courseName} ({item.courseCode})</Text>
      <Text style={styles.location}>📍 {item.location}</Text>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{flex: 1}} />;
  }

  return (
    // Use a View and apply padding from insets
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <SectionList
        sections={timetableData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>No timetable found for this semester.</Text>}
      />
    </View>
  );
};

export default TimetableScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 15, marginTop: 15 },
  itemContainer: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  time: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginBottom: 5 },
  courseName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  location: { fontSize: 14, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' }
});