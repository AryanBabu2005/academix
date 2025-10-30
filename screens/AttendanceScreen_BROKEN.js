// In screens/AttendanceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, addDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const AttendanceScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState({ message: 'Point camera at the QR code', color: 'rgba(255,255,255,0.8)' });

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setStatus({ message: 'Verifying QR code...', color: '#FFCC00' });

    try {
      const { sessionId, secretCode, unitNumber } = JSON.parse(data);
      if (!sessionId || !secretCode || !unitNumber) throw new Error("Invalid QR code format.");

      const sessionDocRef = doc(db, "attendanceSessions", sessionId);
      const sessionDoc = await getDoc(sessionDocRef);

      if (!sessionDoc.exists() || sessionDoc.data().secretCode !== secretCode || sessionDoc.data().expiresAt.toDate() < new Date()) {
        throw new Error("Session is invalid or has expired.");
      }
      
      const sessionData = sessionDoc.data();
      const mainCourseId = sessionData.mainCourseId;
      const totalDuration = sessionData.totalDuration || 1;
      
      const todayDateString = new Date().toISOString().split('T')[0];
      const userId = auth.currentUser.uid;

      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId), where("date", "==", todayDateString), where("mainCourseId", "==", mainCourseId));
      const attendanceSnapshot = await getDocs(attendanceQuery);

      if (attendanceSnapshot.empty) {
        await addDoc(collection(db, "attendance"), {
          userId: userId,
          mainCourseId: mainCourseId,
          date: todayDateString,
          attendedUnits: 1,
          scannedUnits: [unitNumber],
          totalDuration: totalDuration,
          status: 'present',
        });
        setStatus({ message: `Attendance Marked! (1/${totalDuration}) ✅`, color: '#4CAF50' });
      } else {
        const docToUpdate = attendanceSnapshot.docs[0];
        const existingData = docToUpdate.data();

        if (existingData.scannedUnits && existingData.scannedUnits.includes(unitNumber)) {
          throw new Error(`You have already scanned for Hour ${unitNumber}.`);
        }
        
        const newAttendedUnits = (existingData.attendedUnits || 0) + 1;
        await updateDoc(docToUpdate.ref, {
          attendedUnits: newAttendedUnits,
          scannedUnits: [...(existingData.scannedUnits || []), unitNumber]
        });
        setStatus({ message: `Attendance Updated! (${newAttendedUnits}/${totalDuration}) ✅`, color: '#4CAF50' });
      }
    } catch (error) {
      setStatus({ message: `Error: ${error.message} ❌`, color: '#F44336' });
    }
  };

  if (hasPermission === null) {
    return <Text style={styles.permissionText}>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text style={styles.permissionText}>No access to camera. Please enable it in settings.</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeScannerSettings={{ barCodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
          <View style={styles.scanBox}></View>
          <View style={[styles.statusBox, { backgroundColor: status.color }]}>
             <Text style={styles.statusText}>{status.message}</Text>
          </View>
          {scanned && <Button title={'Tap to Scan Again'} onPress={() => { setScanned(false); setStatus({ message: 'Point camera at the QR code', color: 'rgba(255,255,255,0.8)' }); }} />}
      </View>
    </View>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: 'column', 
    justifyContent: 'center' 
  },
  permissionText: { 
    flex: 1, 
    textAlign: 'center', 
    textAlignVertical: 'center', 
    fontSize: 18 
  },
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  scanBox: { 
    width: 300, 
    height: 300, 
    borderWidth: 2, 
    borderColor: '#fff', 
    borderRadius: 10, 
    borderStyle: 'dashed' 
  },
  statusBox: { 
    marginTop: 30, 
    padding: 15, 
    borderRadius: 8, 
    width: '80%' 
  },
  statusText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: 'black' 
  }
});