// In screens/CalculatorScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Platform, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Animatable from 'react-native-animatable';

const CalculatorScreen = () => {
  const insets = useSafeAreaInsets();
  const [userSemester, setUserSemester] = useState(null);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

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
        const coursesGrouped = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          if (!data.mainCourseId) return acc;
          if (!acc[data.mainCourseId]) {
            acc[data.mainCourseId] = {
              label: `${data.courseName} (${data.courseCode})`,
              value: data.mainCourseId,
              schedule: [],
            };
          }
          acc[data.mainCourseId].schedule.push({
            dayOfWeek: data.dayOfWeek,
            duration: data.duration || 1,
          });
          return acc;
        }, {});
        setTimetableEntries(Object.values(coursesGrouped));
      });
      return unsubscribe;
    }
  }, [userSemester]);

  const onDateChange = (event, selectedDate, type) => {
    setShowPicker(null);
    if (selectedDate) {
      if (type === 'start') setStartDate(selectedDate);
      if (type === 'end') setEndDate(selectedDate);
    }
  };
  
  // --- NEW SEQUENTIAL DEBUGGING LOGIC ---
  const handleCalculate = async () => {
    if (!selectedCourse) return Alert.alert("Input required", "Please select a course.");
    setIsCalculating(true);
    setResults(null);
    
    const courseDetails = timetableEntries.find(c => c.value === selectedCourse);
    if (!courseDetails) {
        setIsCalculating(false);
        return Alert.alert("Error", "Could not find course details.");
    }

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    try {
      console.log("\n--- STARTING CALCULATION ---");

      console.log("[1] Fetching holidays...");
      const holidaysQuery = query(collection(db, "holidays"), where("date", ">=", startDateString), where("date", "<=", endDateString));
      const holidaysSnapshot = await getDocs(holidaysQuery);
      const holidayDates = Array.isArray(holidaysSnapshot?.docs) ? holidaysSnapshot.docs.map(doc => doc.data().date) : [];
      console.log(" -> Success. Holidays:", holidayDates);

      console.log("[2] Fetching cancellations...");
      const cancellationsQuery = query(collection(db, "cancellations"), where("mainCourseId", "==", selectedCourse), where("date", ">=", startDateString), where("date", "<=", endDateString));
      const cancellationsSnapshot = await getDocs(cancellationsQuery);
      const cancellationDates = Array.isArray(cancellationsSnapshot?.docs) ? cancellationsSnapshot.docs.map(doc => doc.data().date) : [];
      console.log(" -> Success. Cancellations:", cancellationDates);
      
      console.log("[3] Fetching attendance...");
      const attendanceQuery = query(collection(db, "attendance"), where("mainCourseId", "==", selectedCourse), where("userId", "==", auth.currentUser.uid), where("date", ">=", startDateString), where("date", "<=", endDateString));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendedClasses = Array.isArray(attendanceSnapshot?.docs) ? attendanceSnapshot.docs.reduce((sum, doc) => sum + (doc.data().attendedUnits || 0), 0) : 0;
      console.log(" -> Success. Attended Units:", attendedClasses);

      console.log("[4] Calculating total classes...");
      let totalClasses = 0;
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const currentDay = currentDate.getDay();
        const currentDateString = currentDate.toISOString().split('T')[0];
        const scheduledClass = courseDetails.schedule.find(s => s.dayOfWeek === currentDay);
        if (scheduledClass && !holidayDates.includes(currentDateString) && !cancellationDates.includes(currentDateString)) {
            totalClasses += (scheduledClass.duration || 1);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log(" -> Success. Total Possible Classes:", totalClasses);

      const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0;
      setResults({ total: totalClasses, attended: attendedClasses, percentage: `${percentage}%` });

    } catch (error) {
      console.error("--- CALCULATION FAILED ---", error);
      Alert.alert("Error", "An unexpected error occurred. See terminal for details.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView>
        <Text style={styles.title}>Attendance Calculator</Text>
        <Text style={styles.label}>Select a Course</Text>
        <RNPickerSelect onValueChange={(value) => setSelectedCourse(value)} items={timetableEntries} style={pickerSelectStyles} placeholder={{ label: "Choose a course...", value: null }} />
        <Text style={styles.label}>Select Date Range</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setShowPicker('start')} style={styles.dateInput}><Text>{startDate.toLocaleDateString()}</Text></TouchableOpacity>
          <Text style={styles.dateSeparator}>to</Text>
          <TouchableOpacity onPress={() => setShowPicker('end')} style={styles.dateInput}><Text>{endDate.toLocaleDateString()}</Text></TouchableOpacity>
        </View>
        {showPicker && (<DateTimePicker value={showPicker === 'start' ? startDate : endDate} mode="date" display="default" onChange={(event, date) => onDateChange(event, date, showPicker)} />)}
        {isCalculating ? <ActivityIndicator size="large" style={{marginVertical: 10}}/> : <Button title="Calculate Attendance" onPress={handleCalculate} disabled={!selectedCourse} />}
        {results && (
          <Animatable.View animation="fadeIn" style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results</Text>
            <Text style={styles.resultsText}>Total Classes Held: {results.total}</Text>
            <Text style={styles.resultsText}>Classes Attended: {results.attended}</Text>
            <Text style={styles.resultsPercentage}>Percentage: {results.percentage}</Text>
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
};

export default CalculatorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, color: 'gray', marginBottom: 10, marginTop: 15 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dateInput: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  dateSeparator: { marginHorizontal: 10, fontSize: 16 },
  resultsContainer: { marginTop: 30, padding: 20, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  resultsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  resultsText: { fontSize: 18, marginBottom: 8 },
  resultsPercentage: { fontSize: 22, fontWeight: 'bold', marginTop: 10, color: '#007AFF', textAlign: 'center' },
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, color: 'black', backgroundColor: '#fff', marginBottom: 20 },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, color: 'black', backgroundColor: '#fff', marginBottom: 20 },
});