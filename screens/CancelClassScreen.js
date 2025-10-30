// In screens/CancelClassScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, collectionGroup } from 'firebase/firestore';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';

const CancelClassScreen = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetchFacultyClasses = async () => {
      const q = query(collectionGroup(db, 'timetable'), where('instructorId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const uniqueCourses = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!uniqueCourses[data.mainCourseId]) {
          uniqueCourses[data.mainCourseId] = {
            label: `${data.courseName} (${data.courseCode})`,
            value: data.mainCourseId,
          };
        }
      });
      setMyClasses(Object.values(uniqueCourses));
    };
    fetchFacultyClasses();
  }, []);

  const handleCancelClass = async () => {
    if (!selectedClass || !date) {
      Alert.alert("Error", "Please select a class and a date.");
      return;
    }
    const dateString = date.toISOString().split('T')[0];
    try {
      await addDoc(collection(db, "cancellations"), {
        mainCourseId: selectedClass,
        date: dateString,
      });
      Alert.alert("Success", `Class has been canceled for ${dateString}.`);
    } catch (error) {
      Alert.alert("Error", "Could not cancel class.");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Class to Cancel</Text>
      <RNPickerSelect onValueChange={(value) => setSelectedClass(value)} items={myClasses} style={pickerSelectStyles} placeholder={{ label: "Select your class...", value: null }}/>
      
      <Text style={styles.label}>Select Date of Cancellation</Text>
      <Button title={date.toLocaleDateString()} onPress={() => setShowPicker(true)} />
      {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, selectedDate) => { setShowPicker(false); if(selectedDate) setDate(selectedDate); }}/>)}
      
      <View style={styles.buttonContainer}>
        <Button title="Confirm Cancellation" onPress={handleCancelClass} color="orange" disabled={!selectedClass} />
      </View>
    </View>
  );
};
export default CancelClassScreen;

// (Use the same pickerSelectStyles from CalculatorScreen)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '500', color: 'gray', marginBottom: 10, marginTop: 20 },
  buttonContainer: { marginTop: 40 }
});
const pickerSelectStyles = StyleSheet.create({ /* ... paste from CalculatorScreen ... */ });