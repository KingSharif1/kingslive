"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

export default function CVModal({ open, onClose, cvUrl }: { open: boolean; onClose: () => void; cvUrl: string }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-[90vw] max-h-[90vh] flex flex-col relative"
          initial={{ scale: 0.95, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 40 }}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 overflow-auto p-4">
            <iframe
              src={cvUrl}
              className="w-full h-[60vh] rounded"
              title="CV Preview"
            />
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-800">
            <a
              href={cvUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
