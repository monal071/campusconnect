import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  getResources, 
  addResource as apiAddResource, 
  updateResource as apiUpdateResource,
  deleteResource as apiDeleteResource,
  updateResourceLikes as apiUpdateResourceLikes,
  trackResourceView,
  trackResourceDownload
} from '../../utils/api';
import AddResourceModal from '../../components/AddResourceModal';
import ResourceCard from '../../components/ResourceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 12;

export default function Resources() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const resourceTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'document', label: 'Documents' },
    { value: 'book', label: 'Books' },
    { value: 'video', label: 'Videos' },
    { value: 'link', label: 'Links' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'programming', label: 'Programming' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'literature', label: 'Literature' },
    { value: 'history', label: 'History' },
    { value: 'business', label: 'Business' },
    { value: 'design', label: 'Design' },
    { value: 'technology', label: 'Technology' },
    { value: 'research', label: 'Research' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'reference', label: 'Reference' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'updated', label: 'Recently Updated' }
  ];

  // Fetch resources with current filters
  const fetchResources = async (page = 1, replace = true) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
        search: searchTerm || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined
      };

      const result = await getResources(params);
      
      if (replace) {
        setResources(result.data || []);
      } else {
        setResources(prev => [...prev, ...(result.data || [])]);
      }
      
      setTotalPages(result.totalPages || 1);
      setTotalResources(result.total || 0);
      setHasMore(result.hasMore || false);
      setCurrentPage(page);
      
      // Extract unique tags for filter suggestions
      const allTags = result.data?.flatMap(resource => resource.tags || []) || [];
      setAvailableTags([...new Set(allTags)].sort());
      
    } catch (error) {
      setError('Failed to load resources');
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchResources(1, true);
  }, [searchTerm, selectedType, selectedCategory, sortBy, selectedTags]);

  // Handlers
  const handleAddResource = async (resourceData) => {
    try {
      const result = await apiAddResource(resourceData);
      if (result.data) {
        setResources(prev => [result.data, ...prev]);
        setTotalResources(prev => prev + 1);
      }
      setShowAddModal(false);
      toast.success('Resource added successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to add resource');
    }
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowAddModal(true);
  };

  const handleUpdateResource = async (resourceData) => {
    try {
      const result = await apiUpdateResource(resourceData);
      if (result.data) {
        setResources(prev => 
          prev.map(resource => 
            resource._id === resourceData.resourceId ? result.data : resource
          )
        );
      }
      setShowAddModal(false);
      setEditingResource(null);
      toast.success('Resource updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update resource');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await apiDeleteResource(resourceId);
      setResources(prev => prev.filter(resource => resource._id !== resourceId));
      setTotalResources(prev => prev - 1);
      toast.success('Resource deleted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to delete resource');
    }
  };

  const handleLike = async (resourceId) => {
    try {
      const result = await apiUpdateResourceLikes(resourceId);
      setResources(prev => 
        prev.map(resource => 
          resource._id === resourceId 
            ? { 
                ...resource, 
                likes: result.likes,
                likedBy: result.liked 
                  ? [...(resource.likedBy || []), session?.user?.id].filter(Boolean)
                  : (resource.likedBy || []).filter(id => id !== session?.user?.id)
              }
            : resource
        )
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleView = async (resourceId) => {
    try {
      await trackResourceView(resourceId);
      setResources(prev => 
        prev.map(resource => 
          resource._id === resourceId 
            ? { ...resource, views: (resource.views || 0) + 1 }
            : resource
        )
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      await trackResourceDownload(resourceId);
      setResources(prev => 
        prev.map(resource => 
          resource._id === resourceId 
            ? { ...resource, downloads: (resource.downloads || 0) + 1 }
            : resource
        )
      );
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchResources(currentPage + 1, false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingResource(null);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Loading state
  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => fetchResources(1, true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Resources | CampusConnect</title>
        <meta name="description" content="Discover and share academic resources, documents, books, and learning materials." />
      </Head>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Resources
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Discover and share academic resources, documents, books, and learning materials. Everyone can contribute!
              </p>
            </div>
            {session ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Resource
              </button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Want to contribute? 
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Sign In to Add Resources
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalResources}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Resources
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {resources.filter(r => r.type === 'document').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Documents
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {resources.filter(r => r.type === 'book').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Books
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {resources.filter(r => r.type === 'video').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Videos
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-3 border rounded-lg font-medium transition-colors ${
                  showFilters
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
              
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-l-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'bg-white text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  title="Grid view"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-r-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'bg-white text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  title="List view"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {resourceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {(searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || selectedTags.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 pt-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.slice(0, 20).map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resources Grid/List */}
        <div className="mb-8">
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || selectedTags.length > 0
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Be the first to share a resource with the community! Everyone can contribute - students, faculty, and all members are welcome to upload and share educational materials.'}
              </p>
              {session && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Resource
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }`}>
                <AnimatePresence>
                  {resources.map((resource, index) => (
                    <motion.div
                      key={resource._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ResourceCard
                        resource={resource}
                        onLike={handleLike}
                        onEdit={handleEditResource}
                        onDelete={handleDeleteResource}
                        onView={handleView}
                        onDownload={handleDownload}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More / Pagination */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Resources
                        <span className="ml-2 text-sm text-gray-500">
                          ({resources.length} of {totalResources})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Resource Modal */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onAdd={editingResource ? handleUpdateResource : handleAddResource}
        resource={editingResource}
      />
    </div>
  );
}