// In screens/TakeAttendanceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, writeBatch, doc, collectionGroup } from 'firebase/firestore';
import RNPickerSelect from 'react-native-picker-select';

const TakeAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [myTodayClasses, setMyTodayClasses] = useState([]);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null); // Will hold { id, duration, semester }
  const [studentList, setStudentList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // Stores { studentId: attendedUnits }
  const [existingRecords, setExistingRecords] = useState({}); // Stores existing doc IDs { studentId: docId }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false); // Tracks initial submission

  // Fetch classes taught by this professor today (unchanged)
  useEffect(() => {
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
              value: {
                  id: data.mainCourseId,
                  duration: data.duration || 1,
                  semester: doc.ref.parent.parent.id
              }
            };
        });
        setMyTodayClasses(classes);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayClasses();
  }, []);

  // --- THIS FUNCTION IS NOW MUCH SMARTER ---
  // Fetches students AND checks for existing attendance records for today
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClassInfo) {
        setStudentList([]);
        setAttendanceData({});
        setExistingRecords({});
        setHasSubmittedOnce(false);
        return;
      }
      setLoading(true);
      setAttendanceData({});
      setExistingRecords({});
      setHasSubmittedOnce(false);

      const todayDateString = new Date().toISOString().split('T')[0];

      try {
        // 1. Fetch all students for the selected class's semester
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('semester', '==', selectedClassInfo.semester));
        const studentsSnapshot = await getDocs(studentsQuery);
        const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudentList(students);

        // 2. Fetch any attendance records already submitted for this class today
        const existingAttendanceQuery = query(
          collection(db, "attendance"),
          where("mainCourseId", "==", selectedClassInfo.id),
          where("date", "==", todayDateString),
          where("userId", "in", students.length > 0 ? students.map(s => s.id) : ['dummyId'])
        );
        const existingSnapshot = await getDocs(existingAttendanceQuery);
        
        const records = {};
        const initialData = {};
        existingSnapshot.forEach(doc => {
          records[doc.data().userId] = doc.id; // Store existing doc ID {studentId: docId}
          initialData[doc.data().userId] = doc.data().attendedUnits; // Store existing attendance {studentId: 2}
        });
        setExistingRecords(records);

        // 3. Pre-fill the attendance list
        students.forEach(s => {
          if (initialData[s.id] === undefined) {
             // If no record exists, default this student to FULL attendance
             initialData[s.id] = selectedClassInfo.duration;
          }
        });
        setAttendanceData(initialData);

        // If we found any records, change the button text to "Update"
        if (Object.keys(records).length > 0) {
            setHasSubmittedOnce(true);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Could not fetch student list or attendance.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndAttendance();
  }, [selectedClassInfo]); // Re-run this whenever the professor changes the class in the dropdown

  // Update state when professor taps a button
  const updateAttendance = (studentId, units) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: units }));
  };

  // --- THIS FUNCTION IS NOW CREATE-OR-UPDATE ---
  const handleSubmitAttendance = async () => {
    if (!selectedClassInfo) return;
    setSubmitting(true);
    const todayDateString = new Date().toISOString().split('T')[0];
    const batch = writeBatch(db); // Use a batch for atomic writes

    studentList.forEach(student => {
      const attendedUnits = attendanceData[student.id];
      const existingDocId = existingRecords[student.id];

      if (existingDocId) {
        // If record exists, UPDATE it
        const recordRef = doc(db, "attendance", existingDocId);
        batch.update(recordRef, {
          attendedUnits: attendedUnits,
          status: attendedUnits > 0 ? 'present' : 'absent',
        });
      } else {
        // If record doesn't exist, CREATE it
        const newRecordRef = doc(collection(db, "attendance"));
        batch.set(newRecordRef, {
          userId: student.id,
          mainCourseId: selectedClassInfo.id,
          date: todayDateString,
          attendedUnits: attendedUnits,
          totalDuration: selectedClassInfo.duration,
          status: attendedUnits > 0 ? 'present' : 'absent',
        });
      }
    });

    try {
      await batch.commit();
      setHasSubmittedOnce(true); // Ensure button says "Update" now
      Alert.alert("Success", `Attendance ${hasSubmittedOnce ? 'updated' : 'submitted'} successfully!`);
    } catch (error) {
      Alert.alert("Error", `Failed to ${hasSubmittedOnce ? 'update' : 'submit'} attendance.`);
      console.error("Batch commit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentItem = ({ item }) => {
    const attended = attendanceData[item.id];
    const duration = selectedClassInfo.duration;
    const buttons = Array.from({ length: duration + 1 }, (_, i) => i); // [0, 1, 2]

    return (
      <View style={styles.studentRow}>
        <Text style={styles.studentName} numberOfLines={1}>{item.name || 'N/A'}</Text>
        <View style={styles.buttons}>
          {buttons.map(unit => (
            <TouchableOpacity
              key={unit}
              style={[styles.button, attended === unit && styles.selectedButton]}
              onPress={() => updateAttendance(item.id, unit)}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, attended === unit && styles.selectedButtonText]}>{unit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={(value) => setSelectedClassInfo(value)}
        items={myTodayClasses}
        style={pickerSelectStyles}
        placeholder={{ label: "Select class session...", value: null }}
        disabled={loading || submitting}
      />
      
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {!loading && selectedClassInfo && studentList.length > 0 && (
        <FlatList
          data={studentList}
          renderItem={renderStudentItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={<Text style={styles.listHeader}>Tap unit number (Default: {selectedClassInfo.duration})</Text>}
          style={{marginTop: 10}}
        />
      )}
       {!loading && selectedClassInfo && studentList.length === 0 && (
           <Text style={styles.emptyText}>No students found for this semester.</Text>
       )}

      {!loading && selectedClassInfo && studentList.length > 0 && (
          <View style={styles.submitContainer}>
            <Button
                title={submitting ? "Saving..." : (hasSubmittedOnce ? "Update Attendance" : "Submit Attendance")}
                onPress={handleSubmitAttendance}
                disabled={submitting}
            />
          </View>
      )}
    </View>
  );
};

export default TakeAttendanceScreen;

// --- Styles (Unchanged from before) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listHeader: { textAlign: 'center', paddingVertical: 10, fontSize: 14, color: '#666' },
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  studentName: { fontSize: 16, flexShrink: 1, marginRight: 10 },
  buttons: { flexDirection: 'row' },
  button: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  selectedButton: { backgroundColor: '#007AFF' },
  buttonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  selectedButtonText: { color: '#fff' },
  submitContainer: { padding: 20, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: 'gray'},
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, color: 'black', backgroundColor: '#fff', marginBottom: 10, marginHorizontal: 15 },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, color: 'black', backgroundColor: '#fff', marginBottom: 10, marginHorizontal: 15 },
});