import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";

const HeroSection = ({
  title = "Welcome to CampusConnect",
  subtitle = "Your digital hub for campus life",
  description = "Connect with peers, discover events, find opportunities, and build lasting relationships in your academic community.",
  showImage = true,
  ctaText = "Get Started",
  ctaHref = "/signup",
  secondaryCtaText = "Learn More",
  secondaryCtaHref = "/about",
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:50px_50px] opacity-20"></div>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -top-4 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          className={`grid grid-cols-1 ${showImage ? "lg:grid-cols-2" : ""} gap-12 lg:gap-20 items-center`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Text Content */}
          <motion.div
            className="text-center lg:text-left"
            variants={itemVariants}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-8"
              variants={itemVariants}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Welcome to the future of campus life
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-6 leading-tight"
              variants={itemVariants}
            >
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {word === "CampusConnect" ? (
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {word}
                    </span>
                  ) : (
                    word
                  )}
                  {index < title.split(" ").length - 1 && " "}
                </span>
              ))}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl sm:text-2xl text-white/90 font-medium mb-4"
              variants={itemVariants}
            >
              {subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              className="text-lg text-white/70 mb-8 max-w-2xl leading-relaxed"
              variants={itemVariants}
            >
              {description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Link href={ctaHref}>
                <motion.div
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {ctaText}
                  <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              </Link>

              <Link href={secondaryCtaHref}>
                <motion.div
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {secondaryCtaText}
                </motion.div>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-12 pt-8 border-t border-white/20"
              variants={itemVariants}
            >
              <p className="text-white/60 text-sm mb-4">
                Trusted by students at
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white/40">
                <span className="text-sm font-medium">Stanford University</span>
                <span className="text-sm font-medium">MIT</span>
                <span className="text-sm font-medium">Harvard</span>
                <span className="text-sm font-medium">UC Berkeley</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Image */}
          {showImage && (
            <motion.div className="relative" variants={imageVariants}>
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-3xl opacity-30 transform scale-105"></div>

                {/* Main image container */}
                <motion.div
                  className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl"
                  whileHover={{
                    scale: 1.02,
                    rotateY: 5,
                    rotateX: 5,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                    <Image
                      src="https://cdn.builder.io/o/assets%2F120eb199b6cc47adbce36dcfbc52593e%2Fc15659da75ea420bbc615cd607f1139a?alt=media&token=e0852113-020f-4129-a1d5-fabf881aa6e6&apiKey=120eb199b6cc47adbce36dcfbc52593e"
                      alt="CampusConnect Platform Preview"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Floating elements around image */}
                  <motion.div
                    className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full shadow-lg"
                    animate={{
                      y: [0, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-500 rounded-full shadow-lg"
                    animate={{
                      y: [0, 10, 0],
                      scale: [1, 0.9, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 -right-6 w-4 h-4 bg-pink-500 rounded-full shadow-lg"
                    animate={{
                      x: [0, 10, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>

              {/* Stats cards floating around */}
              <motion.div
                className="absolute -bottom-8 -left-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-white/70 text-sm">Active Students</div>
              </motion.div>

              <motion.div
                className="absolute -top-8 -right-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-xl"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-white/70 text-sm">Universities</div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
