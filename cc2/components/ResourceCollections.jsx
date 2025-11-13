import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon,
  PlayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ResourceCollections({ userId }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [userId]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/collections?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedCollection.resources);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedCollection = {
      ...selectedCollection,
      resources: items,
    };

    setSelectedCollection(updatedCollection);

    // Update order on server
    try {
      await fetch(`/api/resources/collections/${selectedCollection._id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: items.map(r => r._id) }),
      });
    } catch (error) {
      console.error('Error reordering resources:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resource Collections
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Collection
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection, index) => (
          <CollectionCard
            key={collection._id}
            collection={collection}
            index={index}
            onClick={() => setSelectedCollection(collection)}
            onDelete={() => {
              setCollections(collections.filter(c => c._id !== collection._id));
            }}
          />
        ))}

        {collections.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No collections yet. Create your first one!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Collection
            </button>
          </div>
        )}
      </div>

      {/* Collection Detail Modal */}
      {selectedCollection && (
        <CollectionDetailModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
          onUpdate={(updated) => {
            setCollections(collections.map(c => 
              c._id === updated._id ? updated : c
            ));
            setSelectedCollection(updated);
          }}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(newCollection) => {
            setCollections([newCollection, ...collections]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CollectionCard({ collection, index, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            collection.color || 'from-blue-500 to-purple-500'
          } flex items-center justify-center`}>
            <FolderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {collection.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {collection.resources?.length || 0} resources
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-gray-500">⋮</span>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-16 right-6 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-10 py-2 min-w-[150px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Edit collection
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this collection?')) {
                  onDelete();
                }
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {collection.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {collection.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <EyeIcon className="w-4 h-4" />
          {collection.views || 0}
        </div>
        <div className="flex items-center gap-1">
          <PlayIcon className="w-4 h-4" />
          {collection.progress || 0}% complete
        </div>
      </div>

      {/* Tags */}
      {collection.tags && collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {collection.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {collection.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{collection.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CollectionDetailModal({ collection, onClose, onUpdate, onDragEnd }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                collection.color || 'from-blue-500 to-purple-500'
              } flex items-center justify-center`}>
                <FolderIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {collection.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {collection.resources?.length || 0} resources
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>

          {collection.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {collection.description}
            </p>
          )}
        </div>

        {/* Resources List (Draggable) */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="resources">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {collection.resources?.map((resource, index) => (
                    <Draggable
                      key={resource._id}
                      draggableId={resource._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-gray-400">
                              <span className="text-xl">⋮⋮</span>
                            </div>
                            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {resource.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {resource.type} • {resource.views || 0} views
                              </p>
                            </div>
                            <button
                              onClick={() => window.open(resource.url, '_blank')}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {(!collection.resources || collection.resources.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No resources in this collection yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Resources
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CreateCollectionModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/resources/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tags }),
      });

      if (res.ok) {
        const data = await res.json();
        onCreate(data.collection);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create Collection
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="My Learning Path"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="What's this collection about?"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
