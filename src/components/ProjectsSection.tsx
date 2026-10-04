import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type MotionStyle,
} from "framer-motion";
import { useRef } from "react";
import { projects, type Project } from "../data/images";

type ProjectCardProps = {
  project: Project;
  index: number;
  totalCards: number;
};

function ProjectCard({ project, index, totalCards }: ProjectCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  });
  const targetScale = 1 - (totalCards - 1 - index) * 0.03;
  const scale: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 1],
    [1, targetScale],
  );
  const cardStyle = {
    "--card-offset": `${index * 28}px`,
    scale,
    transformOrigin: "top center",
    zIndex: index + 1,
  } as MotionStyle & { "--card-offset": string };

  return (
    <div
      ref={containerRef}
      className="relative h-[85vh] min-h-[620px]"
      style={{ zIndex: index + 1 }}
    >
      <motion.article
        className="project-card sticky mx-auto h-[calc(85vh-2rem)] min-h-[570px] w-full overflow-hidden rounded-[2rem] border-2 border-mist bg-ink p-4 sm:p-6 md:h-[calc(85vh-4rem)] md:rounded-[2.5rem] md:p-8"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-5 pb-4 sm:pb-6">
          <span className="text-[clamp(3.6rem,8vw,7.5rem)] font-black leading-[0.8] tracking-normal text-mist">
            {project.number}
          </span>
          <h3 className="pt-2 text-right text-[clamp(1.25rem,3vw,2.75rem)] font-semibold uppercase leading-none text-mist">
            {project.name}
          </h3>
        </div>

        <div className="grid h-[calc(100%-5.5rem)] min-h-0 grid-cols-[40%_60%] gap-3 md:h-[calc(100%-8rem)] md:gap-4">
          <div className="grid min-h-0 grid-rows-2 gap-3 md:gap-4">
            {project.col1.map((image, imageIndex) => (
              <div
                className="min-h-0 overflow-hidden rounded-[1rem] bg-white/[0.04] sm:rounded-[1.5rem]"
                key={image}
              >
                <img
                  alt={`${project.name} detail ${imageIndex + 1}`}
                  className="h-full w-full object-cover"
                  decoding="async"
                  loading="lazy"
                  src={image}
                />
              </div>
            ))}
          </div>

          <div className="min-h-0 overflow-hidden rounded-[1rem] bg-white/[0.04] sm:rounded-[1.5rem]">
            <img
              alt={`${project.name} main visual`}
              className="h-full w-full object-cover"
              decoding="async"
              loading="lazy"
              src={project.col2}
            />
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 overflow-x-clip rounded-t-[2.5rem] bg-transparent px-4 pb-[18vh] pt-24 sm:px-6 md:-mt-16 md:rounded-t-[4rem] md:px-10 md:pt-32 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <h2 className="hero-heading mb-16 text-center text-[clamp(4rem,12vw,11rem)] font-black uppercase leading-none sm:mb-20 md:mb-28">
          Project
        </h2>

        <div className="relative">
          {projects.map((project, index) => (
            <ProjectCard
              index={index}
              key={project.number}
              project={project}
              totalCards={projects.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
