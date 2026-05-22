import { useState, useEffect, useRef } from "react";

type Phase = { d: number; label: string; scale: number };
type Technique = { id: string; name: string; phases: Phase[] };

const TECHNIQUES: Technique[] = [
  {
    id: "box",
    name: "Box Breathing",
    phases: [
      { d: 4, label: "Hít vào", scale: 1.35 },
      { d: 4, label: "Giữ", scale: 1.35 },
      { d: 4, label: "Thở ra", scale: 0.68 },
      { d: 4, label: "Giữ", scale: 0.68 },
    ],
  },
  {
    id: "478",
    name: "4-7-8",
    phases: [
      { d: 4, label: "Hít vào", scale: 1.35 },
      { d: 7, label: "Giữ", scale: 1.35 },
      { d: 8, label: "Thở ra", scale: 0.68 },
    ],
  },
  {
    id: "deep",
    name: "Thở sâu",
    phases: [
      { d: 4, label: "Hít vào", scale: 1.35 },
      { d: 6, label: "Thở ra", scale: 0.68 },
    ],
  },
];

export const BreathingGuide = () => {
  const [techIdx, setTechIdx] = useState(0);
  const [display, setDisplay] = useState({
    label: TECHNIQUES[0].phases[0].label,
    seconds: TECHNIQUES[0].phases[0].d,
    phaseDuration: TECHNIQUES[0].phases[0].d,
    targetScale: TECHNIQUES[0].phases[0].scale,
  });

  const phasesRef = useRef<Phase[]>(TECHNIQUES[0].phases);
  const phaseIdxRef = useRef(0);
  const secondsRef = useRef(TECHNIQUES[0].phases[0].d);

  useEffect(() => {
    const phases = TECHNIQUES[techIdx].phases;
    phasesRef.current = phases;
    phaseIdxRef.current = 0;
    secondsRef.current = phases[0].d;

    setDisplay({
      label: phases[0].label,
      seconds: phases[0].d,
      phaseDuration: phases[0].d,
      targetScale: phases[0].scale,
    });

    const interval = setInterval(() => {
      secondsRef.current--;
      if (secondsRef.current <= 0) {
        phaseIdxRef.current = (phaseIdxRef.current + 1) % phasesRef.current.length;
        const next = phasesRef.current[phaseIdxRef.current];
        secondsRef.current = next.d;
        setDisplay({
          label: next.label,
          seconds: next.d,
          phaseDuration: next.d,
          targetScale: next.scale,
        });
      } else {
        setDisplay(prev => ({ ...prev, seconds: secondsRef.current }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [techIdx]);

  const { label, seconds, phaseDuration, targetScale } = display;
  const circleTransform = `scale(${targetScale})`;
  const circleTransition = `transform ${phaseDuration}s ease-in-out`;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Technique selector */}
      <div className="flex gap-2">
        {TECHNIQUES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTechIdx(i)}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all duration-300 ${
              techIdx === i
                ? "bg-primary/30 text-primary border-primary/60 font-medium"
                : "border-white/25 text-white/55 hover:text-white/80 hover:border-white/40"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Breathing circle */}
      <div
        key={techIdx}
        className="relative w-44 h-44 flex items-center justify-center"
      >
        {/* Outermost glow ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          style={{ transform: circleTransform, transition: circleTransition }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full bg-primary/15"
          style={{
            width: "80%", height: "80%",
            transform: circleTransform,
            transition: circleTransition,
          }}
        />
        {/* Inner filled circle */}
        <div
          className="absolute rounded-full bg-primary/30 border border-primary/50"
          style={{
            width: "60%", height: "60%",
            transform: circleTransform,
            transition: circleTransition,
          }}
        />

        {/* Center content */}
        <div className="relative z-10 text-center select-none">
          <p className="text-3xl font-light text-white">{seconds}</p>
          <p className="text-[11px] text-white/70 mt-1 tracking-[0.15em] uppercase">{label}</p>
        </div>
      </div>

      {/* Pattern description */}
      <p className="text-[11px] text-white/45 tracking-wider">
        {TECHNIQUES[techIdx].phases.map(p => p.d).join(" – ")} giây
      </p>
    </div>
  );
};
