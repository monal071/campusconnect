import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import TimeAgo from "timeago-react";
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Article {
  url: string;
  title: string;
  publishedAt: string;
}

export default function News() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArticle, setHoveredArticle] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    if (!session) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch news');
    } finally {
      setIsRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleArticleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view news.</p>
      </div>
    );
  }

  if (isRefreshing && articles.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchNews} />;
  }

  return (
    <>
      <Head>
        <title>News - Link Cube</title>
      </Head>

      <div className="w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h1>
          <button
            onClick={fetchNews}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-black/20 transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh news"
          >
            <RefreshRoundedIcon className="h-6 w-6" />
          </button>
        </div>

        <ErrorBoundary>
          <div className="space-y-4">
            {articles.length > 0 ? (
              articles.map((article) => (
                <div
                  key={article.url}
                  onClick={() => handleArticleClick(article.url)}
                  onMouseEnter={() => setHoveredArticle(article.url)}
                  onMouseLeave={() => setHoveredArticle(null)}
                  className={`bg-white dark:bg-[#1D2226] rounded-lg p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                    hoveredArticle === article.url
                      ? 'bg-black/5 dark:bg-black/20 transform scale-[1.02]'
                      : 'hover:bg-black/5 dark:hover:bg-black/10'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <FiberManualRecordRoundedIcon className="!h-2 !w-2 mt-2 text-blue-500" />
                    <div className="flex-1">
                      <h2 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                        {article.title}
                      </h2>
                      <TimeAgo
                        datetime={article.publishedAt}
                        className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  📰
                </div>
                <p className="text-lg font-medium mb-2">No news available</p>
                <p className="text-sm">Check back later for the latest updates</p>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </>
  );
} 