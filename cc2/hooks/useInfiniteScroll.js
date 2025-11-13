import { useState, useEffect, useCallback, useRef } from "react";

export default function useInfiniteScroll({
  fetchData,
  hasMore: initialHasMore = true,
  threshold = 100,
}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState(null);

  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchData(page);

      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData((prevData) => [...prevData, ...newData]);
      }
    } catch (err) {
      setError(err.message || "Failed to load more data");
      console.error("Infinite scroll error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, [page]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);

    setLoading(true);
    try {
      const newData = await fetchData(1);
      setData(newData);
      if (newData.length === 0) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err.message || "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    data,
    loading,
    hasMore,
    error,
    lastElementRef,
    reset,
    refresh,
    setData,
  };
}
