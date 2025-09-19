import { motion, AnimatePresence } from "framer-motion";
import Backdrop from "./Backdrop";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@mui/material";
import { useRecoilValue } from "recoil";
import Post from "./Post";

const dropIn = {
  hidden: {
    y: "-10vh",
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: "0",
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      type: "spring",
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    y: "10vh",
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const gifYouUp = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

const Modal = ({ handleClose, type }) => {
  const { data: session } = useSession();
  const post = useRecoilValue(getPostState);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose]);

  return (
    <AnimatePresence>
      <Backdrop onClick={handleClose}>
        {type === "dropIn" && (
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col justify-center bg-white dark:bg-gray-900 w-full max-w-lg md:-mt-96 mx-6 border border-gray-200 dark:border-gray-700"
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between border-b border-white/75 px-4 py-2.5">
              <h4 className="text-xl">Create a post</h4>
              <button
                onClick={handleClose}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Avatar src={session?.user?.image} className="!h-11 !w-11" />
                <h6>{session?.user?.name}</h6>
              </div>
            </div>
          </motion.div>
        )}

        {type === "gifYouUp" && (
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="rounded-l-lg flex bg-[#1D2226] w-full max-w-6xl -mt-[7vh] mx-6"
            variants={gifYouUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.img
              alt=""
              onDoubleClick={handleClose}
              src={post.photoUrl}
              className="object-contain max-h-[80vh] w-full max-w-3xl rounded-l-lg"
            />
            <div className="w-full md:w-3/5 bg-white dark:bg-[#1D2226] rounded-r-lg">
              <Post post={post} modalPost />
            </div>
          </motion.div>
        )}
      </Backdrop>
    </AnimatePresence>
  );
};

export default Modal;
