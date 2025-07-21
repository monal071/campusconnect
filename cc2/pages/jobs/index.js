import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
// import AddJobModal from '../../components/AddJobModal';
import PasswordModal from '../../components/PasswordModal';

export default function Jobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  // const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        // Defensive: ensure jobs is always an array
        setJobs(Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleAddJob = async (jobData) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const newJob = await response.json();
      setJobs(prev => [newJob, ...prev]);
      setShowAddModal(false);
      toast.success('Job added successfully!');
    } catch (error) {
      toast.error('Failed to add job');
    }
  };

  const handleAddClick = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setShowAddModal(true);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = selectedType === 'all' || job.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>Jobs | CampusConnect</title>
      </Head>
      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title">Jobs</h1>
          <div className="page-actions">
            <button
              onClick={handleAddClick}
              className="btn btn-primary hover-lift"
            >
              Post a Job
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div className="page-content">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="card p-4 hover:shadow-md transition-all animate-fade-in"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h2>
                <span className="badge badge-primary">{job.type}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mt-1 mb-3">{job.company}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">{job.description}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {job.skills.map(skill => (
                  <span key={skill} className="badge badge-blue">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {filteredJobs.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
            No jobs found matching your criteria.
          </div>
        )}
      </main>
      {showPasswordModal && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      {/* AddJobModal removed, now in admin page */}
    </div>
  );
}