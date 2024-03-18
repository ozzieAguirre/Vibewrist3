import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useState, useEffect, useRef } from 'react';

const bleManager = new BleManager();
const SERVICE_UUID = '7A0247E7-8E88-409B-A959-AB5092DDB03E';
const CHAR_UUID = '82258BAA-DF72-47E8-99BC-B73D7ECD08A5';

export default function App() {
  const [deviceID, setDeviceID] = useState(null);
  const [devices, setDevices] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Searching...');
  const deviceRef = useRef(null);
  const [characteristicValue, setCharacteristicValue] = useState('');
  const [DataCharacteristic, setDataChar] = useState(null);

  const searchAndConnectToDevice = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setConnectionStatus('Error searching for devices');
        return;
      }
      if (device.name === 'ESP32') {
        bleManager.stopDeviceScan();
        setConnectionStatus('Connecting...');
        connectToDevice(device);
      }
    });
  };

  useEffect(() => {
    searchAndConnectToDevice();
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus('Connected');
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        console.log(device.characteristics);
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        let char = characteristics.find((c) => c.uuid === CHAR_UUID);
        return char.read();
      })
      .then((char) => {
        const value = Buffer.from(char.value, 'base64').toString('utf-8');
        setCharacteristicValue(value);
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus('Error in Connection');
      });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log('Disconnected with error:', error);
        }
        setConnectionStatus('Disconnected');
        console.log('Disconnected device');
        //setStepCount(0); // Reset the step count
        if (deviceRef.current) {
          setConnectionStatus('Reconnecting...');
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus('Connected'))
            .catch((error) => {
              console.log('Reconnection failed: ', error);
              setConnectionStatus('Reconnection failed');
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  const searchForDevices = () => {
    setDevices([]); // Clear the current list
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setConnectionStatus('Error searching for devices');
        return;
      }
      if (device.name == 'ESP32') {
        console.log('In loop');
        bleManager.stopDeviceScan();
        setConnectionStatus('Connecting...');
        connectToDevice(device);
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setConnectionStatus('Scan complete');
    }, 100000); // stop scanning after 10 seconds
  };

  useEffect(() => {
    searchForDevices();
    return () => bleManager.stopDeviceScan(); // Ensure scanning is stopped when the component unmounts
  }, []);

  const renderDevice = ({ item }) => (
    <Text style={styles.deviceText}>
      {item.name} ({item.id})
    </Text>
  );

  return (
    <View style={styles.container}>
      <Text>App.js to start working on your app!</Text>
      <Text>App.js to start working on your app!</Text>
      <Text>App.js to start working on your app!</Text>
      <Text>{connectionStatus}</Text>

      <Text>Characteristic Value: {characteristicValue}</Text>
      {/* <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
      /> */}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
