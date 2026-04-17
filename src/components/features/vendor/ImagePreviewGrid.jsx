import { motion, AnimatePresence } from "framer-motion";

export default function ImagePreviewGrid({ images, onRemove }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-secondary)",
          }}
        >
          Selected Images
        </span>
        <span
          className="text-xs font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-primary)",
          }}
        >
          {images.length} image{images.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <AnimatePresence>
          {images.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.04,
              }}
              className="relative rounded-xl overflow-hidden group"
              style={{
                aspectRatio: "1",
                background: "var(--color-bg-secondary)",
              }}
            >
              <img
                src={item.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Overlay on hover */}
              <motion.div
                className="absolute inset-0 flex items-start justify-end p-1.5"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{ background: "rgba(26,26,46,0.3)" }}
              >
                {onRemove && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemove && onRemove(item.id)}
                    aria-label="Remove image"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold leading-none"
                    style={{ background: "rgba(201,42,42,0.9)" }}
                  >
                    ×
                  </motion.button>
                )}
              </motion.div>

              {/* Index badge */}
              <div
                className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {index + 1}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
