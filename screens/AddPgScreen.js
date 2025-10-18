import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { usePg } from '../context/PgContext';

export default function AddPgScreen({ navigation }) {
  const { addPg } = usePg();
  const webviewRef = useRef(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const html = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .leaflet-container { background: #fff; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
        <script>
          const RN = window.ReactNativeWebView;
          const map = L.map('map').setView([28.6139, 77.2090], 12);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          let selectedMarker = null;

          // Notify RN to disable parent scroll when interacting with map
          const startInteract = () => RN.postMessage(JSON.stringify({ type: 'touchStart' }));
          const endInteract = () => RN.postMessage(JSON.stringify({ type: 'touchEnd' }));
          document.addEventListener('touchstart', startInteract, { passive: true });
          document.addEventListener('touchend', endInteract, { passive: true });
          document.addEventListener('mousedown', startInteract);
          document.addEventListener('mouseup', endInteract);

          map.on('click', function(e) {
            if (selectedMarker) {
              map.removeLayer(selectedMarker);
            }
            selectedMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            selectedMarker.bindPopup('Selected Location').openPopup();
            
            RN.postMessage(JSON.stringify({
              type: 'locationSelected',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });

          // Receive messages from React Native
          document.addEventListener('message', (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'centerMap') {
                map.setView([msg.lat, msg.lng], 15);
              }
            } catch (e) { /* ignore */ }
          });
        </script>
      </body>
    </html>
  `, []);

  const postToWeb = (obj) => {
    webviewRef.current?.postMessage(JSON.stringify(obj));
  };

  const onAdd = () => {
    if (!name || !price || !selectedLat || !selectedLng) {
      Alert.alert('Missing data', 'Please fill Name, Price and select location on map');
      return;
    }
    addPg({ 
      name, 
      price: Number(price), 
      availability: availability || 'Available', 
      lat: selectedLat, 
      lng: selectedLng, 
      location 
    });
    navigation.goBack();
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setSelectedLat(data.lat);
        setSelectedLng(data.lng);
      } else if (data.type === 'touchStart') {
        setScrollEnabled(false);
      } else if (data.type === 'touchEnd') {
        setScrollEnabled(true);
      }
    } catch (e) {
      // ignore
    }
  };

  const centerMapOnLocation = async () => {
    const query = location.trim();
    if (!query) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PG-Locator/1.0 (contact: example@example.com)',
        },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        postToWeb({ type: 'centerMap', lat: Number(lat), lng: Number(lon) });
      } else {
        Alert.alert('Not found', 'Could not find that location.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to geocode location. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled">
        <View style={styles.formSection}>
          <Text style={styles.header}>Add PG</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Availability" value={availability} onChangeText={setAvailability} />
          <TextInput 
            style={styles.input} 
            placeholder="Location (Area/Locality)" 
            value={location} 
            onChangeText={setLocation}
            onSubmitEditing={centerMapOnLocation}
          />
          
          <Text style={styles.mapLabel}>Tap on map to select location:</Text>
          <View style={styles.mapContainer}>
            <WebView
              ref={webviewRef}
              originWhitelist={["*"]}
              source={{ html }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              allowFileAccess
              allowUniversalAccessFromFileURLs
            />
          </View>
          
          {selectedLat && selectedLng && (
            <Text style={styles.selectedLocation}>
              Selected: {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}
            </Text>
          )}
          
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Save PG</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  formSection: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedLocation: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});


