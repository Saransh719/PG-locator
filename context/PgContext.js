import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios

const PgContext = createContext({
  pgs: [],
  addPg: (_pg) => {},
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
        const response = await axios.get('https://your-backend-api.com/pgs');
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
      const response = await axios.post('https://your-backend-api.com/pgs', pg, {
        headers: { 'Content-Type': 'application/json' },
      });
      setPgs((prev) => [...prev, response.data]); // Add the new PG to the state
    } catch (err) {
      console.error('Failed to add PG:', err.message); // Log errors
    }
  }, []);

  return (
    <PgContext.Provider value={{ pgs, addPg, loading, error }}>
      {children}
    </PgContext.Provider>
  );
}

export function usePg() {
  return useContext(PgContext);
}


