import { Avatar } from "@mui/material";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PostAddIcon from "@mui/icons-material/PostAdd";

const stats = [
  { label: "Profile Views", value: 0, Icon: VisibilityIcon },
  { label: "Saved Posts", value: 0, Icon: BookmarkOutlinedIcon },
  { label: "Connections", value: 0, Icon: PersonIcon },
  { label: "Posts", value: 0, Icon: PostAddIcon },
];

const Sidebar = () => {
  // TODO: Fetch user data from API or props if needed
  // For now, render sidebar without user context
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden md:flex flex-col w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800/50"
    >
      {/* Profile Section */}
      <div className="relative flex flex-col items-center pt-8 pb-4">
        <div className="relative w-full h-32">
          <Image
            src="https://rb.gy/i26zak"
            fill
            priority
            className="object-cover opacity-50"
            alt="Sidebar background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative -mt-12"
        >
          <Avatar
            // src={user?.image}
            className="!h-24 !w-24 !border-4 !border-slate-900 !cursor-pointer"
          />
        </motion.div>

        <div className="mt-4 text-center px-4">
          <motion.h4
            whileHover={{ scale: 1.02 }}
            className="text-xl font-semibold text-white cursor-pointer"
          >
            {/* {user?.name} */}
            User Name
          </motion.h4>
          <p className="text-slate-400 text-sm mt-1">
            {/* {user?.email} */}
            user@example.com
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-4 space-y-2">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 hover-lift transition-colors"
          >
            <div className="flex items-center space-x-3">
              <stat.Icon className="text-blue-500" />
              <span className="text-slate-300">{stat.label}</span>
            </div>
            <span className="badge badge-primary">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Actions Section */}
      <div className="mt-auto px-4 py-4 space-y-2">
        <Link href="/posts">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full hover-lift"
          >
            <AddRoundedIcon className="mr-2" />
            <span>Create Post</span>
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default Sidebar;