import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TimeAgo from "timeago-react";
import { useState } from "react";
import ErrorBoundary from "./ErrorBoundary";

interface Article {
  url: string;
  title: string;
  publishedAt: string;
}

interface WidgetsProps {
  articles?: Article[];
  onRefresh?: () => Promise<void>;
}

function NewsSection({ articles = [], onRefresh }: WidgetsProps) {
  const [hoveredArticle, setHoveredArticle] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleArticleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1D2226] py-2.5 rounded-lg space-y-2 w-11/12 overflow-hidden border border-gray-300 dark:border-none">
      <div className="flex items-center justify-between font-bold px-2.5">
        <h4>Link Cube News</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-black/20 transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh news"
          >
            <RefreshRoundedIcon className="h-5 w-5" />
          </button>
          <InfoRoundedIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-1">
        {articles.length > 0 ? (
          articles.slice(0, 5).map((article) => (
            <div
              key={article.url}
              onClick={() => handleArticleClick(article.url)}
              onMouseEnter={() => setHoveredArticle(article.url)}
              onMouseLeave={() => setHoveredArticle(null)}
              className={`flex space-x-2 items-center cursor-pointer px-2.5 py-1 transition-colors duration-200 ${
                hoveredArticle === article.url
                  ? 'bg-black/10 dark:bg-black/20'
                  : 'hover:bg-black/5 dark:hover:bg-black/10'
              }`}
            >
              <FiberManualRecordRoundedIcon className="!h-2 !w-2" />
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm truncate pr-4">
                  {article.title}
                </h5>
                <TimeAgo
                  datetime={article.publishedAt}
                  className="text-xs mt-0.5 dark:text-white/75 opacity-80"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="px-2.5 py-1 text-sm text-gray-500 dark:text-gray-400">
            No news available at the moment
          </div>
        )}
      </div>
    </div>
  );
}

function Widgets(props: WidgetsProps) {
  return (
    <div className="hidden xl:inline space-y-2">
      <ErrorBoundary>
        <NewsSection {...props} />
      </ErrorBoundary>
    </div>
  );
}

export default Widgets; 