interface AnatomyDiagramProps {
  selectedRegion: string | null;
  onSelect: (region: string) => void;
}

const regions = [
  { id: "Left Ear", label: "Left Ear", shape: "rect", props: { x: 32, y: 80, width: 50, height: 90, rx: 12 } },
  { id: "Right Ear", label: "Right Ear", shape: "rect", props: { x: 218, y: 80, width: 50, height: 90, rx: 12 } },
  { id: "Nose", label: "Nose", shape: "polygon", props: { points: "150,60 135,125 150,150 165,125" } },
  { id: "Throat", label: "Throat", shape: "rect", props: { x: 130, y: 150, width: 40, height: 35, rx: 8 } },
  { id: "Neck", label: "Neck", shape: "rect", props: { x: 120, y: 185, width: 60, height: 50, rx: 10 } },
];

const AnatomyDiagram = ({ selectedRegion, onSelect }: AnatomyDiagramProps) => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Anatomy</p>
          <h3 className="text-lg font-semibold text-slate-900">Tap a region to begin</h3>
        </div>
        {selectedRegion && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedRegion}</span>}
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <svg viewBox="0 0 300 260" className="w-full" role="img" aria-label="Head and neck diagram">
          <defs>
            <linearGradient id="skin" x1="0" x2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path d="M120 40 C120 15 180 15 180 40 L180 95 C180 130 160 150 150 160 C140 150 120 130 120 95 Z" fill="url(#skin)" />
          {regions.map((region) => {
            const isActive = selectedRegion === region.id;
            const common = {
              className: `cursor-pointer transition-all ${isActive ? "fill-primary/70 stroke-primary stroke-2" : "fill-white/80 stroke-slate-400"}`,
              onClick: () => onSelect(region.id),
            };
            if (region.shape === "rect") {
              const { x, y, width, height, rx } = region.props as { x: number; y: number; width: number; height: number; rx: number };
              return <rect key={region.id} {...common} x={x} y={y} width={width} height={height} rx={rx} />;
            }
            if (region.shape === "polygon") {
              const { points } = region.props as { points: string };
              return <polygon key={region.id} {...common} points={points} />;
            }
            return null;
          })}
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${selectedRegion === r.id ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnatomyDiagram;

