import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { getResources, addResource as apiAddResource, updateResourceLikes as apiUpdateResourceLikes } from '../../utils/api';
import AddResourceModal from '../../components/AddResourceModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

// Simple ResourceCard component
function ResourceCard({ resource, onLike }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {resource.title}
          </h3>
          <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            {resource.type}
          </span>
        </div>
        <button
          onClick={() => onLike(resource._id)}
          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <span>❤️</span>
          <span className="text-sm font-medium">{resource.likes || 0}</span>
        </button>
      </div>
      
      {resource.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {resource.description}
        </p>
      )}
      
      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View Resource
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
      
      {resource.author && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Shared by {resource.author}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Resources() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch (error) {
        setError('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleAddResource = async (resourceData) => {
    try {
      const newResource = await apiAddResource(resourceData);
      setResources(prev => [newResource, ...prev]);
      setShowAddModal(false);
      toast.success('Resource added successfully!');
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  const handleLike = async (resourceId) => {
    try {
      const result = await apiUpdateResourceLikes(resourceId);
      setResources(prev => 
        prev.map(resource => 
          resource._id === resourceId 
            ? { ...resource, likes: result.likes }
            : resource
        )
      );
      toast.success(result.liked ? 'Resource liked!' : 'Resource unliked!');
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const filteredResources = Array.isArray(resources) ? resources.filter(resource => {
    const matchesSearch = 
      (resource.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (resource.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (resource.tags || []).some(tag => 
        (tag?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesType;
  }) : [];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Resources | CampusConnect</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resources</h1>
          <div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Resource
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="book">Books</option>
            <option value="video">Videos</option>
            <option value="link">Links</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onLike={handleLike}
            />
          ))}
        </div>
        {filteredResources.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
            {searchTerm || selectedType !== 'all' 
              ? 'No resources found matching your criteria.'
              : 'No resources available. Add some resources to get started!'}
          </div>
        )}
      </main>
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddResource}
      />
    </div>
  );
}