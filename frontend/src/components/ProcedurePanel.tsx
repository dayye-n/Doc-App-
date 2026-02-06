import type { ProcedureTemplate } from "../types";

interface Props {
  templates: ProcedureTemplate[];
  selectedTemplateId: string | null;
  onSelect: (template: ProcedureTemplate) => void;
}

const ProcedurePanel = ({ templates, selectedTemplateId, onSelect }: Props) => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Procedures</p>
          <h3 className="text-lg font-semibold text-slate-900">Pick a template</h3>
        </div>
        <span className="text-xs text-slate-500">{templates.length} available</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className={`rounded-xl border p-3 text-left transition ${
              selectedTemplateId === tpl.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-sm font-semibold">{tpl.name}</div>
            <div className="text-xs text-slate-500">Region: {tpl.region}</div>
            <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
              {tpl.fields.length} inputs / {tpl.text_blocks.length} text blocks
            </div>
          </button>
        ))}
        {templates.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Pick an anatomy region to see procedures.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcedurePanel;
