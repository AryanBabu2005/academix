// In screens/DeclareHolidayScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, TextInput } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const DeclareHolidayScreen = () => {
  const [date, setDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleDeclareHoliday = async () => {
    if (!reason || !date) {
      Alert.alert("Error", "Please enter a date and a reason.");
      return;
    }
    const dateString = date.toISOString().split('T')[0];
    try {
      await addDoc(collection(db, "holidays"), {
        date: dateString,
        reason: reason,
      });
      Alert.alert("Success", `Holiday declared for ${dateString}.`);
      setReason('');
    } catch (error) {
      Alert.alert("Error", "Could not declare holiday.");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Holiday Date</Text>
      <Button title={date.toLocaleDateString()} onPress={() => setShowPicker(true)} />
      {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, selectedDate) => { setShowPicker(false); if(selectedDate) setDate(selectedDate); }}/>)}
      
      <Text style={styles.label}>Reason for Holiday</Text>
      <TextInput style={styles.input} placeholder="e.g., College Foundation Day" value={reason} onChangeText={setReason} />
      
      <View style={styles.buttonContainer}>
        <Button title="Declare Holiday" onPress={handleDeclareHoliday} color="green" />
      </View>
    </View>
  );
};
export default DeclareHolidayScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '500', color: 'gray', marginBottom: 10, marginTop: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, fontSize: 16, borderRadius: 6 },
  buttonContainer: { marginTop: 40 }
});