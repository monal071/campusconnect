import { motion } from 'framer-motion';

export default function FilterBar({ filters, setFilters }) {
  const expertiseOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning',
    'Data Science', 'UI/UX Design', 'Product Management', 'Marketing'
  ];

  const handleExpertiseChange = (expertise) => {
    const newExpertise = filters.expertise.includes(expertise)
      ? filters.expertise.filter(e => e !== expertise)
      : [...filters.expertise, expertise];
    
    setFilters({ ...filters, expertise: newExpertise });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8"
    >
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Expertise Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Expertise</label>
          <div className="flex flex-wrap gap-2">
            {expertiseOptions.map(expertise => (
              <button
                key={expertise}
                onClick={() => handleExpertiseChange(expertise)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.expertise.includes(expertise)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {expertise}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Min Experience (years)</label>
          <input
            type="number"
            min="0"
            max="20"
            value={filters.experience}
            onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        {/* Rate Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Max Rate ($/hour)</label>
          <input
            type="number"
            min="0"
            max="500"
            value={filters.rate}
            onChange={(e) => setFilters({ ...filters, rate: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => setFilters({ expertise: [], experience: '', rate: '' })}
        className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        Clear Filters
      </button>
    </motion.div>
  );
}