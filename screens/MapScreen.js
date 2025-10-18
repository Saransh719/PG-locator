import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { usePg } from '../context/PgContext';

export default function MapScreen({ navigation }) {
  const { searchPgs, pgs, loading, error } = usePg();
  const webviewRef = useRef(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [isWebViewReady, setIsWebViewReady] = useState(false);

  const html = `
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

          const pgMarkers = [];
          let readySent = false;

          function addPgMarker(pg) {
            if (!pg.lat || !pg.lng) return;
            const marker = L.marker([pg.lat, pg.lng]).addTo(map);
            marker.bindPopup('<b>' + pg.name + '</b><br/>Price: ₹' + pg.price);
            marker.__pg = pg;
            pgMarkers.push(marker);
          }

          function clearMarkers() {
            pgMarkers.forEach(m => map.removeLayer(m));
            pgMarkers.length = 0;
          }

          function renderMarkers(pgs) {
            clearMarkers();
            pgs.forEach(addPgMarker);
            if (pgMarkers.length > 0) {
              const group = L.featureGroup(pgMarkers);
              map.fitBounds(group.getBounds().pad(0.25));
            }
          }

          window.addEventListener('load', () => {
            if (!readySent) {
              RN.postMessage(JSON.stringify({ type: 'webviewReady' }));
              readySent = true;
            }
          });

          document.addEventListener('message', (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'renderMarkers') {
                renderMarkers(msg.payload || []);
              }
            } catch (e) { }
          });
        </script>
      </body>
    </html>
  `;

  const postToWeb = useCallback((obj) => {
    if (isWebViewReady) {
      webviewRef.current?.postMessage(JSON.stringify(obj));
    }
  }, [isWebViewReady]);

  const syncMarkers = useCallback(async () => {
    if (!isWebViewReady) return;

    try {
        const criteria = {};
        if (filterLocation.trim()) {
            criteria.location = filterLocation.trim(); // Add location filter
        }
        if (filterMaxPrice) {
            const max = Number(filterMaxPrice);
            if (!Number.isNaN(max)) {
                criteria.maxPrice = max;
            }
        }

        await searchPgs(criteria); // Fetch filtered PGs
    } catch (err) {
        console.error("Error syncing markers:", err.message);
    }
}, [searchPgs, filterLocation, filterMaxPrice, isWebViewReady]);

  useEffect(() => {
    if (isWebViewReady && pgs.length >= 0) {
      postToWeb({ type: 'renderMarkers', payload: pgs });
    }
  }, [pgs, isWebViewReady, postToWeb]);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'webviewReady') {
        setIsWebViewReady(true);
        syncMarkers();
      }
    } catch (e) {
      // Silent fail
    }
  }, [syncMarkers]);

  const goToAddPg = () => navigation.navigate('AddPg');

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.error}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={syncMarkers}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.controls}>
            <Text style={styles.header}>
              Find PGs {loading && <Text style={styles.loading}>●</Text>}
            </Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Location contains"
                value={filterLocation}
                onChangeText={setFilterLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="Max Price"
                value={filterMaxPrice}
                onChangeText={setFilterMaxPrice}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={syncMarkers}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Searching...' : 'Apply Filters'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.debug}>{pgs.length} PGs loaded</Text>
          </View>

          <View style={styles.mapWrap}>
            <WebView
              ref={webviewRef}
              source={{ html }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              allowFileAccess
              allowUniversalAccessFromFileURLs
            />
          </View>

          <TouchableOpacity style={styles.fab} onPress={goToAddPg}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  controls: {
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#9ca3af',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mapWrap: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
  loading: {
    color: '#2563eb',
  },
  debug: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  retryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});