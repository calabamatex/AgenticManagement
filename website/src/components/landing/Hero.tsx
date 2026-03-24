'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function Hero() {
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial="initial"
      animate="animate"
      transition={{ staggerChildren: 0.15 }}
    >
      <motion.h1
        className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <span className="block text-gray-900 dark:text-white">
          Your AI Agents Forget Everything.
        </span>
        <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          We Fix That.
        </span>
      </motion.h1>

      <motion.p
        className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        Zero-dependency agent safety with hash-chained memory, secret detection,
        risk scoring, and progressive enablement. 60-second setup.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col gap-4 sm:flex-row"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <Link
          href="/docs"
          className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Get Started
        </Link>
        <Link
          href="/roi"
          className="rounded-lg border border-primary px-8 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          See ROI
        </Link>
      </motion.div>
    </motion.div>
  );
}
