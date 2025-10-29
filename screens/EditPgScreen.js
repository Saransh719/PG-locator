import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import axios from "axios";
import { usePg } from "../context/PgContext";
import { HOST, PORT } from "@env";

const BASE_URL = `http://${HOST}:${PORT}`;

export default function ViewEditPGScreen({ route, navigation }) {
  const { pg } = route.params;
  const { updatePg } = usePg();

  const webviewRef = useRef(null);
  const [name, setName] = useState(pg.name);
  const [price, setPrice] = useState(pg.price.toString());
  const [location, setLocation] = useState(pg.location);
  const [isAvailable, setIsAvailable] = useState(pg.available);
  const [selectedLat, setSelectedLat] = useState(pg.lat);
  const [selectedLng, setSelectedLng] = useState(pg.lng);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // ✅ Map HTML using Leaflet (same as AddPG)
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
          const map = L.map('map').setView([${pg.lat}, ${pg.lng}], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          let selectedMarker = L.marker([${pg.lat}, ${pg.lng}]).addTo(map);
          selectedMarker.bindPopup("${pg.name}").openPopup();

          const startInteract = () => RN.postMessage(JSON.stringify({ type: 'touchStart' }));
          const endInteract = () => RN.postMessage(JSON.stringify({ type: 'touchEnd' }));
          document.addEventListener('touchstart', startInteract, { passive: true });
          document.addEventListener('touchend', endInteract, { passive: true });
          document.addEventListener('mousedown', startInteract);
          document.addEventListener('mouseup', endInteract);

          map.on('click', function(e) {
            if (selectedMarker) map.removeLayer(selectedMarker);
            selectedMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            selectedMarker.bindPopup('Selected Location').openPopup();
            RN.postMessage(JSON.stringify({
              type: 'locationSelected',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });

          document.addEventListener('message', (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'centerMap') {
                map.setView([msg.lat, msg.lng], 15);
              }
            } catch (e) {}
          });
        </script>
      </body>
    </html>
  `, []);

  const postToWeb = (obj) => {
    webviewRef.current?.postMessage(JSON.stringify(obj));
  };

  // ✅ Center map on typed location
  const centerMapOnLocation = async () => {
    const query = location.trim();
    if (!query) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PG-Locator/1.0 (contact: example@example.com)",
        },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon } = data[0];
        postToWeb({ type: "centerMap", lat: Number(lat), lng: Number(lon) });
      } else {
        Alert.alert("Not found", "Could not find that location.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to geocode location. Try again.");
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "locationSelected") {
        setSelectedLat(data.lat);
        setSelectedLng(data.lng);
      } else if (data.type === "touchStart") {
        setScrollEnabled(false);
      } else if (data.type === "touchEnd") {
        setScrollEnabled(true);
      }
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        name,
        price: Number(price),
        location,
        lat: selectedLat,
        lng: selectedLng,
        available: isAvailable,
      };

      await axios.put(`${BASE_URL}/pgs/${pg._id}`, updatedData);
      updatePg(pg._id, updatedData);
      Alert.alert("Success", "PG updated successfully");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Failed to update PG: " + err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.header}>View / Edit PG</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Available</Text>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#2563eb" }}
                thumbColor={isAvailable ? "#ffffff" : "#f4f4f4"}
                onValueChange={setIsAvailable}
                value={isAvailable}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Location (Area/Locality)"
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={centerMapOnLocation}
            />

            <Text style={styles.mapLabel}>Tap on map to update location:</Text>
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

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  formSection: { padding: 16 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#1e293b" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    marginBottom: 12,
  },
  switchLabel: { fontSize: 16, color: "#374151", fontWeight: "500" },
  mapLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#374151" },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedLocation: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});
