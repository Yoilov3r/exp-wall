import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

type AnimatedCharacterProps = {
  character: string;
  progress: MotionValue<number>;
  range: [number, number];
  index: number;
};

function AnimatedCharacter({
  character,
  progress,
  range,
  index,
}: AnimatedCharacterProps) {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <motion.span
      aria-hidden="true"
      className="inline-block whitespace-pre"
      style={{ opacity }}
      key={`${character}-${index}`}
    >
      {character}
    </motion.span>
  );
}

type AnimatedTextProps = {
  text: string;
  className?: string;
};

export function AnimatedText({ text, className = "" }: AnimatedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"],
  });
  const characters = Array.from(text);

  return (
    <p
      ref={containerRef}
      aria-label={text}
      className={`relative leading-relaxed ${className}`}
    >
      {characters.map((character, index) => {
        const start = index / characters.length;
        const end = Math.min(1, (index + 1.8) / characters.length);

        return (
          <AnimatedCharacter
            character={character}
            index={index}
            key={`${character}-${index}`}
            progress={scrollYProgress}
            range={[start, end]}
          />
        );
      })}
    </p>
  );
}
