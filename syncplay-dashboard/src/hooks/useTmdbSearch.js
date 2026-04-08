import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8080';

export const useTmdbSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const email = currentUser?.email || 'test@example.com';

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tmdb/search?query=${encodeURIComponent(query)}&email=${encodeURIComponent(email)}&region=KR`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('TMDB Search Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
};
