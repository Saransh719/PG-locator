import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios
import {HOST,PORT} from '@env';

var BASE_URL=`http://${HOST}:${PORT}`;

const PgContext = createContext({
  pgs: [],
  addPg: (_pg) => {},
  searchPgs: (_criteria) => {},
});

export function PgProvider({ children }) {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch PGs from the backend
  useEffect(() => {
    const fetchPgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${BASE_URL}/pgs`);
        setPgs(response.data); // Update state with fetched PGs
      } catch (err) {
        setError(err.message); // Handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchPgs();
  }, []);

  // Add a new PG to the backend
  const addPg = useCallback(async (pg) => {
    try {
      const response = await axios.post(`${BASE_URL}/pgs`, pg, {
        headers: { 'Content-Type': 'application/json' },
      });
      setPgs((prev) => [...prev, response.data]); // Add the new PG to the state
    } catch (err) {
      console.error('Failed to add PG:', err.message); // Log errors
    }
  }, []);

  // Search PGs based on criteria
  const searchPgs = useCallback(async (criteria) => {
    setLoading(true);
    setError(null);
    try {
        const response = await axios.get(`${BASE_URL}/pgs/search`, { params: criteria });
        setPgs(response.data); // Update state with searched PGs
    } catch (err) {
        setError(err.message); // Handle errors
    } finally {
        setLoading(false);
    }
}, []);

const updatePg = useCallback(async (id, updatedData) => {
  try {
    const response = await axios.put(`${BASE_URL}/pgs/${id}`, updatedData, {
      headers: { "Content-Type": "application/json" },
    });

    // update local state with the edited PG
    setPgs((prev) =>
      prev.map((pg) => (pg._id === id ? response.data : pg))
    );
  } catch (err) {
    console.error("Failed to update PG:", err.message);
  }
}, []);


  return (
    <PgContext.Provider value={{ pgs, addPg, searchPgs,updatePg, loading, error }}>
      {children}
    </PgContext.Provider>
  );
}

export function usePg() {
  return useContext(PgContext);
}



