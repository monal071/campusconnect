import { motion } from 'framer-motion';
import Image from 'next/image';

// Empty States for different scenarios
export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  illustration = '/empty-state.svg' 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {illustration ? (
        <div className="mb-6 relative w-64 h-64">
          <Image
            src={illustration}
            alt={title}
            fill
            className="object-contain opacity-50 dark:opacity-30"
          />
        </div>
      ) : icon ? (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          {icon}
        </div>
      ) : null}
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>
      
      {action && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

// No Posts
export function NoPosts({ onCreatePost }) {
  return (
    <EmptyState
      title="No posts yet"
      description="Be the first to share something with your community! Start a conversation, share an idea, or ask a question."
      action={
        onCreatePost ? (
          <button
            onClick={onCreatePost}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Create Your First Post
          </button>
        ) : null
      }
    />
  );
}

// No Resources
export function NoResources({ onAddResource }) {
  return (
    <EmptyState
      title="No resources found"
      description="Start building your knowledge library! Upload study materials, notes, or share helpful links with your peers."
      action={
        onAddResource ? (
          <button
            onClick={onAddResource}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Add First Resource
          </button>
        ) : null
      }
    />
  );
}

// No Events
export function NoEvents({ onCreateEvent }) {
  return (
    <EmptyState
      title="No upcoming events"
      description="Stay connected with your campus community. Create events for study groups, workshops, or social gatherings."
      action={
        onCreateEvent ? (
          <button
            onClick={onCreateEvent}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            Create Event
          </button>
        ) : null
      }
    />
  );
}

// No Quizzes
export function NoQuizzes({ onCreateQuiz, userRole }) {
  return (
    <EmptyState
      title="No quizzes available"
      description={
        userRole === 'faculty' || userRole === 'admin'
          ? "Create engaging quizzes to test your students' knowledge and track their progress."
          : "No quizzes have been created yet. Check back later for new assessments!"
      }
      action={
        (userRole === 'faculty' || userRole === 'admin') && onCreateQuiz ? (
          <button
            onClick={onCreateQuiz}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
          >
            Create Quiz
          </button>
        ) : null
      }
    />
  );
}

// No Connections
export function NoConnections({ onBrowseUsers }) {
  return (
    <EmptyState
      title="No connections yet"
      description="Start building your network! Connect with classmates, faculty, and alumni to collaborate and share knowledge."
      action={
        onBrowseUsers ? (
          <button
            onClick={onBrowseUsers}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Find People to Connect
          </button>
        ) : null
      }
    />
  );
}

// No Bookmarks
export function NoBookmarks() {
  return (
    <EmptyState
      title="No saved items"
      description="Start bookmarking posts, resources, events, and quizzes you want to revisit later. Your saved items will appear here."
      action={
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Explore Content
        </button>
      }
    />
  );
}

// No Search Results
export function NoSearchResults({ query, onClearSearch }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or browse all content.`}
      action={
        onClearSearch ? (
          <button
            onClick={onClearSearch}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Clear Search
          </button>
        ) : null
      }
    />
  );
}

// No Notifications
export function NoNotifications() {
  return (
    <EmptyState
      title="All caught up!"
      description="You don't have any new notifications. We'll let you know when something important happens."
    />
  );
}

// Error State
export function ErrorState({ title, description, onRetry }) {
  return (
    <EmptyState
      title={title || 'Something went wrong'}
      description={description || 'We encountered an error while loading this content. Please try again.'}
      action={
        onRetry ? (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Try Again
          </button>
        ) : null
      }
    />
  );
}

// Coming Soon
export function ComingSoon({ feature }) {
  return (
    <EmptyState
      title="Coming Soon"
      description={`${feature} is under development and will be available soon. Stay tuned for updates!`}
    />
  );
}

// Maintenance Mode
export function MaintenanceMode() {
  return (
    <EmptyState
      title="Under Maintenance"
      description="We're currently performing scheduled maintenance. This feature will be back online shortly. Thank you for your patience!"
    />
  );
}
