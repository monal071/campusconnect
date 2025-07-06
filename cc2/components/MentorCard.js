import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export default function MentorCard({ mentor, onConnect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#1D1D1D] rounded-xl p-6 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onConnect}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden">
          <Image
            src={mentor.userId.image || '/default-avatar.png'}
            alt={mentor.userId.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{mentor.userId.name}</h3>
          <div className="flex items-center gap-1 text-yellow-400">
            <StarIcon className="w-4 h-4" />
            <span>{mentor.rating || 'New'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {mentor.expertise.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 text-sm bg-[#252525] rounded-full text-gray-300"
            >
              {skill}
            </span>
          ))}
        </div>

        <p className="text-gray-400 line-clamp-3">{mentor.bio}</p>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <WorkIcon className="w-4 h-4" />
            <span>{mentor.experience} years exp.</span>
          </div>
          <div className="flex items-center gap-2">
            <AccessTimeIcon className="w-4 h-4" />
            <span>{mentor.availability}</span>
          </div>
          <div className="flex items-center gap-2">
            <AttachMoneyIcon className="w-4 h-4" />
            <span>${mentor.rate}/hour</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{mentor.mentees.length} mentees</span>
          </div>
        </div>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t border-gray-700"
        >
          <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
            Connect with Mentor
          </button>
        </motion.div>
      )}
    </motion.div>
  );
} 