import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ResourceVersionControl({ resourceId, currentVersion }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareVersion, setCompareVersion] = useState(null);

  useEffect(() => {
    if (resourceId) {
      fetchVersions();
    }
  }, [resourceId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!confirm('Restore this version? This will create a new version based on the selected one.')) {
      return;
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}/versions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Version restored successfully');
        fetchVersions();
        setShowVersionModal(false);
        window.location.reload(); // Reload to show restored content
      } else {
        throw new Error('Failed to restore version');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to restore version');
    }
  };

  const handleCreateVersion = async (changeNote) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeNote }),
      });

      if (res.ok) {
        toast.success('New version created');
        fetchVersions();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create version');
    }
  };

  const getChangeType = (changes) => {
    if (!changes) return 'update';
    if (changes.includes('created')) return 'created';
    if (changes.includes('restored')) return 'restored';
    if (changes.includes('major')) return 'major';
    return 'minor';
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'created':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'restored':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'major':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'minor':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Version History
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setComparing(!comparing)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              comparing
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {comparing ? 'Cancel Compare' : 'Compare Versions'}
          </button>
        </div>
      </div>

      {/* Current Version Badge */}
      {currentVersion && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                Current Version: {currentVersion.version}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Last updated {new Date(currentVersion.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Timeline */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading versions...</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No version history available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const changeType = getChangeType(version.changeNote);
            const isLatest = index === 0;
            
            return (
              <motion.div
                key={version._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${
                  isLatest
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`} />

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Version {version.version}
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            Latest
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getChangeColor(changeType)}`}>
                          {changeType}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {version.changeNote || 'No description'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                        {version.author && (
                          <span>by {version.author.name}</span>
                        )}
                        {version.size && (
                          <span>{(version.size / 1024).toFixed(2)} KB</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {comparing ? (
                        <button
                          onClick={() => {
                            if (compareVersion === version._id) {
                              setCompareVersion(null);
                            } else if (!compareVersion) {
                              setCompareVersion(version._id);
                            } else {
                              // Compare selected versions
                              setSelectedVersion(version);
                              setShowVersionModal(true);
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            compareVersion === version._id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {compareVersion === version._id ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <DocumentDuplicateIcon className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowVersionModal(true);
                            }}
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="View version"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          {!isLatest && (
                            <button
                              onClick={() => handleRestoreVersion(version._id)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              title="Restore this version"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Changes Summary */}
                  {version.changes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {version.changes.added > 0 && (
                          <div className="text-green-600 dark:text-green-400">
                            +{version.changes.added} additions
                          </div>
                        )}
                        {version.changes.removed > 0 && (
                          <div className="text-red-600 dark:text-red-400">
                            -{version.changes.removed} deletions
                          </div>
                        )}
                        {version.changes.modified > 0 && (
                          <div className="text-yellow-600 dark:text-yellow-400">
                            ~{version.changes.modified} modifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Version Detail Modal */}
      <AnimatePresence>
        {showVersionModal && selectedVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowVersionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Version {selectedVersion.version} Details
                  </h3>
                  <button
                    onClick={() => setShowVersionModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Version metadata */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedVersion.author && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Author:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedVersion.author.name}
                      </span>
                    </div>
                  )}
                  {selectedVersion.changeNote && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Changes:</span>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {selectedVersion.changeNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Content preview */}
                {selectedVersion.content && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Content Preview
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {typeof selectedVersion.content === 'string'
                          ? selectedVersion.content
                          : JSON.stringify(selectedVersion.content, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedVersion.version !== currentVersion?.version && (
                  <button
                    onClick={() => handleRestoreVersion(selectedVersion._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Restore This Version
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
