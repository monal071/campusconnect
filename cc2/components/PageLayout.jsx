import { motion } from "framer-motion";
import Head from "next/head";

export default function PageLayout({ title, children, actions }) {
  return (
    <>
      <Head>
        <title>{title} | CampusConnect</title>
      </Head>
      
      <div className="page-container">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="page-header"
        >
          <h1 className="page-title">{title}</h1>
          {actions && <div className="page-actions">{actions}</div>}
        </motion.div>
        
        <div className="page-content">
          {children}
        </div>
      </div>
    </>
  );
}
