"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className = "",
  duration = 800,
}: {
  value:     number;
  prefix?:   string;
  suffix?:   string;
  className?: string;
  duration?:  number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from  = 0;
    const to    = value;
    const frame = (now: number) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + ease * (to - from)));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
