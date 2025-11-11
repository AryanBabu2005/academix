// In screens/FacultyDashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const FacultyDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Faculty Dashboard</Text>
        <TouchableOpacity onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={28} color="#E53935" />
        </TouchableOpacity>
      </View>
      <Text style={styles.welcomeText}>Welcome, {auth.currentUser?.email}</Text>

      <View style={styles.grid}>
        
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TakeAttendance')}>
          <Ionicons name="checkmark-done-circle-outline" size={40} color="#007AFF" />
          <Text style={styles.cardText}>Take Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CancelClass')}>
          <Ionicons name="close-circle-outline" size={40} color="#F57C00" />
          <Text style={styles.cardText}>Cancel a Class</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DeclareHoliday')}>
          <Ionicons name="calendar-outline" size={40} color="#388E3C" />
          <Text style={styles.cardText}>Declare a Holiday</Text>
        </TouchableOpacity>

        {/* --- ADD THIS NEW BUTTON FOR CREATING EVENTS --- */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CreateEvent')}>
          <Ionicons name="megaphone-outline" size={40} color="#7B1FA2" />
          <Text style={styles.cardText}>Create Event</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};
export default FacultyDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  welcomeText: { fontSize: 16, color: 'gray', paddingHorizontal: 20, marginBottom: 20 },
  grid: { paddingHorizontal: 15, marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20 },
  cardText: { fontWeight: '600', fontSize: 18, marginTop: 10 },
});