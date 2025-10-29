import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { usePg } from "../context/PgContext";

export default function PGListScreen({ navigation }) {
  const { pgs } = usePg();

  const renderPgItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("EditPg", { pg: item })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}/month</Text>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={[styles.available, { color: item.available ? "green" : "red" }]}>
          {item.available ? "Available" : "Not Available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      
      {pgs.length === 0 ? (
        <Text style={styles.emptyText}>No PGs available yet.</Text>
      ) : (
        <FlatList
          data={pgs}
          keyExtractor={(item) => item._id}
          renderItem={renderPgItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  price: {
    color: "#2563eb",
    fontWeight: "500",
    marginBottom: 4,
  },
  location: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 6,
  },
  available: {
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#6b7280",
  },
});
