import { useEffect, useRef, useState } from "react";
import { marqueeImages } from "../data/images";

const firstRowImages = marqueeImages.slice(0, 11);
const secondRowImages = marqueeImages.slice(11, 21);
const repeatedFirstRow = [...firstRowImages, ...firstRowImages, ...firstRowImages];
const repeatedSecondRow = [
  ...secondRowImages,
  ...secondRowImages,
  ...secondRowImages,
];

type MarqueeRowProps = {
  images: string[];
  offset: number;
  reverse?: boolean;
  row: "one" | "two";
};

function MarqueeRow({ images, offset, reverse = false, row }: MarqueeRowProps) {
  const movement = reverse ? -(offset - 200) : offset - 200;

  return (
    <div
      aria-label={`Marquee row ${row}`}
      className="marquee-row flex w-max gap-3 font-kanit"
      style={{
        transform: `translate3d(${movement}px, 0, 0)`,
        willChange: "transform",
      }}
    >
      {images.map((image, index) => (
        <div
          className="h-[270px] w-[420px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.04]"
          key={`${row}-${index}`}
        >
          <img
            alt={`Marquee visual ${row} ${index + 1}`}
            className="h-full w-full object-cover"
            decoding="async"
            loading="lazy"
            src={image}
          />
        </div>
      ))}
    </div>
  );
}

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionTop, setSectionTop] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateMeasurements = () => {
      if (!sectionRef.current) {
        return;
      }

      setSectionTop(sectionRef.current.offsetTop);
      setViewportHeight(window.innerHeight);
      setScrollY(window.scrollY);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    updateMeasurements();
    window.addEventListener("resize", updateMeasurements);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updateMeasurements);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const offset = (scrollY - sectionTop + viewportHeight) * 0.3;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-clip bg-transparent py-24 sm:py-28 md:py-36"
    >
      <div className="flex flex-col gap-3">
        <MarqueeRow images={repeatedFirstRow} offset={offset} row="one" />
        <MarqueeRow images={repeatedSecondRow} offset={offset} reverse row="two" />
      </div>
    </section>
  );
}
