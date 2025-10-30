// In screens/LiveAttendanceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import RNPickerSelect from 'react-native-picker-select';
import QRCode from 'react-native-qrcode-svg';

const LiveAttendanceScreen = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [session, setSession] = useState(null); // Will hold the active QR code data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches the classes this specific professor teaches on the current day
    const fetchTodayClasses = async () => {
      setLoading(true);
      const todayDayNumber = new Date().getDay();
      const q = query(
        collectionGroup(db, 'timetable'), 
        where('instructorId', '==', auth.currentUser.uid), 
        where('dayOfWeek', '==', todayDayNumber)
      );
      
      try {
        const querySnapshot = await getDocs(q);
        const classes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              label: `${data.courseName} (${data.startTime})`, 
              value: data.mainCourseId 
            };
        });
        setMyClasses(classes);
      } catch (error) {
        console.error("Error fetching faculty classes: ", error);
        Alert.alert("Error", "Could not fetch your classes. Make sure Firestore indexes are built.");
      } finally {
        setLoading(false);
      }
    };
    fetchTodayClasses();
  }, []);

  const handleStartSession = async () => {
    if (!selectedClass) {
      return Alert.alert("Error", "Please select a class to start the session.");
    }
    setLoading(true);

    const secretCode = Math.random().toString(36).substring(2, 10);
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 20); // QR code is valid for 20 minutes

    try {
      const docRef = await addDoc(collection(db, "attendanceSessions"), {
        mainCourseId: selectedClass,
        secretCode: secretCode,
        expiresAt: expiryDate,
        createdAt: serverTimestamp(),
      });
      setSession({ sessionId: docRef.id, secretCode: secretCode });
    } catch (error) {
      console.error("Error starting session: ", error);
      Alert.alert("Error", "Could not start the attendance session.");
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    // If a session is active, show the QR code full screen
    return (
      <View style={styles.qrContainer}>
        <Text style={styles.qrInstruction}>Students: Scan this code to mark your attendance.</Text>
        <Text style={styles.qrSubtitle}>This code will expire in 20 minutes.</Text>
        <View style={styles.qrCodeWrapper}>
            <QRCode
              value={JSON.stringify({ sessionId: session.sessionId, secretCode: session.secretCode })}
              size={300}
              backgroundColor='white'
              color='black'
            />
        </View>
        <Button title="End Session & Go Back" onPress={() => setSession(null)} color="#E53935" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select your class for today:</Text>
      {loading ? <ActivityIndicator size="large" /> : (
        <RNPickerSelect 
          onValueChange={(value) => setSelectedClass(value)} 
          items={myClasses} 
          style={pickerSelectStyles} 
          placeholder={{ label: "Select a class session...", value: null }}
        />
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Start 20-Minute Attendance Session" 
          onPress={handleStartSession} 
          disabled={!selectedClass || loading} 
        />
      </View>
    </View>
  );
};

export default LiveAttendanceScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: 'gray', 
    marginBottom: 10, 
    marginTop: 20 
  },
  buttonContainer: { 
    marginTop: 40 
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 20,
  },
  qrInstruction: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  qrSubtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
  qrCodeWrapper: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      marginBottom: 40,
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { 
    fontSize: 16, 
    paddingVertical: 12, 
    paddingHorizontal: 10, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    color: 'black', 
    backgroundColor: '#f9f9f9', 
    marginBottom: 20 
  },
  inputAndroid: { 
    fontSize: 16, 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    color: 'black', 
    backgroundColor: '#f9f9f9', 
    marginBottom: 20 
  },
});