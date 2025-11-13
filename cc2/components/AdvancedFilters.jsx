import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function AdvancedFilters({
  onApplyFilters,
  contentType = "posts",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: "all", // all, today, week, month, custom
    startDate: "",
    endDate: "",
    tags: [],
    author: "",
    sortBy: "recent", // recent, popular, mostLiked, mostViewed
    showVerified: false,
  });
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load saved presets and available tags
  useEffect(() => {
    loadSavedPresets();
    fetchAvailableTags();
  }, [contentType]);

  const loadSavedPresets = () => {
    const saved = localStorage.getItem(`filter-presets-${contentType}`);
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch(`/api/${contentType}/tags`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleApply = () => {
    // Build filter object
    const appliedFilters = { ...filters };

    // Handle date range
    if (filters.dateRange !== "all" && filters.dateRange !== "custom") {
      const now = new Date();
      let startDate = new Date();

      switch (filters.dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      appliedFilters.startDate = startDate.toISOString();
      appliedFilters.endDate = now.toISOString();
    }

    onApplyFilters(appliedFilters);
    setIsOpen(false);
    toast.success("Filters applied!");
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: "all",
      startDate: "",
      endDate: "",
      tags: [],
      author: "",
      sortBy: "recent",
      showVerified: false,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    toast.success("Filters reset!");
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters },
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem(
      `filter-presets-${contentType}`,
      JSON.stringify(updated)
    );

    setPresetName("");
    setShowSavePreset(false);
    toast.success(`Preset "${presetName}" saved!`);
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset.filters);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const handleDeletePreset = (presetId) => {
    const updated = savedPresets.filter((p) => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem(
      `filter-presets-${contentType}`,
      JSON.stringify(updated)
    );
    toast.success("Preset deleted");
  };

  const toggleTag = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filters
        </span>
        {(filters.tags.length > 0 ||
          filters.dateRange !== "all" ||
          filters.showVerified) && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
            {filters.tags.length +
              (filters.dateRange !== "all" ? 1 : 0) +
              (filters.showVerified ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Advanced Filters
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date Range */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Date Range</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["all", "today", "week", "month"].map((range) => (
                      <button
                        key={range}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, dateRange: range }))
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filters.dateRange === range
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>

                  {filters.dateRange === "custom" && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <TagIcon className="h-4 w-4" />
                    <span>Tags</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          filters.tags.includes(tag)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {tag}
                        {filters.tags.includes(tag) && (
                          <CheckIcon className="inline-block h-3 w-3 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    <span>Sort By</span>
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="mostLiked">Most Liked</option>
                    <option value="mostViewed">Most Viewed</option>
                  </select>
                </div>

                {/* Show Verified Only */}
                {contentType === "resources" && (
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showVerified}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            showVerified: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show verified resources only
                      </span>
                    </label>
                  </div>
                )}

                {/* Saved Presets */}
                {savedPresets.length > 0 && (
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <BookmarkIcon className="h-4 w-4" />
                      <span>Saved Presets</span>
                    </label>
                    <div className="space-y-2">
                      {savedPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {preset.name}
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save as Preset */}
                {showSavePreset ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSavePreset()
                      }
                    />
                    <button
                      onClick={handleSavePreset}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSavePreset(false);
                        setPresetName("");
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSavePreset(true)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                  >
                    Save current filters as preset
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
