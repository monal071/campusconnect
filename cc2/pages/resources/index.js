import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { getResources, addResource as apiAddResource, updateResourceLikes as apiUpdateResourceLikes } from '../../utils/api';
import AddResourceModal from '../../components/AddResourceModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

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
      await apiUpdateResourceLikes(resourceId);
      setResources(prev => 
        prev.map(resource => 
          resource._id === resourceId ? { ...resource, likes: resource.likes + 1 } : resource
        )
      );
      toast.success('Resource liked!');
    } catch (error) {
      toast.error('Failed to like resource');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white">
      <Head>
        <title>Resources | CampusConnect</title>
      </Head>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-xl tracking-tight">Resources</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-lg transition-all"
          >
            Add Resource
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="book">Books</option>
            <option value="video">Videos</option>
            <option value="link">Links</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onLike={handleLike}
            />
          ))}
        </div>
        {filteredResources.length === 0 && (
          <div className="text-center text-blue-100 mt-8">
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