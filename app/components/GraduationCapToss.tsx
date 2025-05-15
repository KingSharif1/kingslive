import React, { useState } from "react";

const caps = [
  "🎓", "🧑‍🎓", "👩‍🎓", "👨‍🎓"
];

const GraduationCapToss = () => {
  const [flyingCaps, setFlyingCaps] = useState<any[]>([]);

  const tossCap = () => {
    const cap = caps[Math.floor(Math.random() * caps.length)];
    const left = Math.random() * 80 + 10;
    setFlyingCaps([...flyingCaps, { cap, left, id: Date.now() + Math.random() }]);
    setTimeout(() => {
      setFlyingCaps(fcs => fcs.slice(1));
    }, 1800);
  };

  return (
    <div className="relative w-full flex flex-col items-center mt-8">
      <button
        className="bg-purple-500 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-600 transition mb-4"
        onClick={tossCap}
      >
        Toss a Graduation Cap!
      </button>
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none">
        {flyingCaps.map(({ cap, left, id }) => (
          <span
            key={id}
            className="absolute text-4xl animate-bounce"
            style={{ left: `${left}%`, top: 0 }}
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GraduationCapToss;
