import { fetchJSON } from "../utils/fetch-json";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  FolderIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

const SEARCH_TYPES = {
  posts: { icon: DocumentTextIcon, label: "Posts", color: "text-blue-600" },
  resources: { icon: FolderIcon, label: "Resources", color: "text-green-600" },
  quizzes: {
    icon: AcademicCapIcon,
    label: "Quizzes",
    color: "text-purple-600",
  },
  events: { icon: CalendarIcon, label: "Events", color: "text-orange-600" },
  jobs: { icon: BriefcaseIcon, label: "Jobs", color: "text-pink-600" },
  communities: {
    icon: UserGroupIcon,
    label: "Communities",
    color: "text-indigo-600",
  },
};

export default function GlobalSearch({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const router = useRouter();

  const readRecent = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      return Array.isArray(stored) ? stored.filter((value) => typeof value === "string").slice(0, 10) : [];
    } catch { return []; }
  };
  useEffect(() => {
    if (isOpen) setRecentSearches(readRecent().slice(0, 5));
  }, [isOpen]);

  useEffect(() => {
    setResults([]);
    setError("");
    setLoading(false);
    if (!isOpen || searchQuery.trim().length < 3) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: searchQuery.trim(), type: selectedType });
        const data = await fetchJSON(`/api/search/global?${params}`, { signal: controller.signal });
        if (!controller.signal.aborted) setResults(data.results || []);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [isOpen, searchQuery, selectedType]);

  const saveRecentSearch = (query) => {
    try { localStorage.setItem("recentSearches", JSON.stringify([query, ...readRecent().filter((item) => item !== query)].slice(0, 10))); }
    catch { /* Search remains usable when storage is disabled. */ }
  };

  const handleResultClick = (result) => {
    saveRecentSearch(searchQuery);
    onClose();

    // Navigate based on result type
    switch (result.type) {
      case "posts":
        router.push(`/posts`);
        break;
      case "resources":
        router.push(`/resources`);
        break;
      case "quizzes":
        router.push(`/quiz`);
        break;
      case "events":
        router.push(`/events`);
        break;
      case "jobs":
        router.push(`/jobs`);
        break;
      case "communities":
        router.push(`/communities/${result._id}`);
        break;
    }
  };

  const handleRecentClick = (query) => {
    setSearchQuery(query);
  };

  const clearRecentSearches = () => {
    try { localStorage.removeItem("recentSearches"); } catch {}
    setRecentSearches([]);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} initialFocus={inputRef}>
        <Dialog.Title className="sr-only">Search CampusConnect</Dialog.Title>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                {/* Search Input */}
                <div className="relative border-b border-gray-200 dark:border-gray-700">
                  <MagnifyingGlassIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    aria-label="Search CampusConnect"
                    maxLength={100}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search everything... (posts, resources, quizzes, events, jobs, communities)"
                    className="w-full py-4 pl-12 pr-12 text-lg bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 p-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <button
                    onClick={() => setSelectedType("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedType === "all"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    All
                  </button>
                  {Object.entries(SEARCH_TYPES).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedType === key
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Results or Recent Searches */}
                <div className="max-h-96 overflow-y-auto p-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Searching...
                      </p>
                    </div>
                  ) : error ? (<p role="alert" className="p-6 text-center text-red-600 dark:text-red-400">{error}</p>) : searchQuery.trim().length > 2 ? (
                    results.length > 0 ? (
                      <div className="space-y-2">
                        {results.map((result, index) => {
                          const TypeIcon =
                            SEARCH_TYPES[result.type]?.icon || DocumentTextIcon;
                          const colorClass =
                            SEARCH_TYPES[result.type]?.color || "text-gray-600";

                          return (
                            <motion.button
                              type="button"
                              key={`${result.type}-${result._id}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleResultClick(result)}
                              className="w-full text-left flex items-start p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            >
                              <div className={`flex-shrink-0 ${colorClass}`}>
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.title ||
                                    result.quizName ||
                                    result.name}
                                </p>
                                {result.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {result.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-400 capitalize">
                                    {result.type}
                                  </span>
                                  {result.author && (
                                    <>
                                      <span className="text-xs text-gray-400">
                                        •
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {typeof result.author === "string" ? result.author : result.author.name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                          No results found
                        </p>
                        <p className="text-sm text-gray-400">
                          Try different keywords
                        </p>
                      </div>
                    )
                  ) : recentSearches.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentClick(search)}
                            className="flex items-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                          >
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-3" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {search}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Start typing to search
                      </p>
                      <p className="text-sm text-gray-400">
                        Search across posts, resources, quizzes & more
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with shortcuts */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-750">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>
                        Press{" "}
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                          ↵
                        </kbd>{" "}
                        to select
                      </span>
                      <span>
                        Press{" "}
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                          ESC
                        </kbd>{" "}
                        to close
                      </span>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
