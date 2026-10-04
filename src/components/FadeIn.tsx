import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.8,
  x = 0,
  y = 0,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ delay, duration, ease: smoothEase }}
    >
      {children}
    </motion.div>
  );
}

