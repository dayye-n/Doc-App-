import { useState } from "react";
import { aiApi, handleApiError } from "../lib/api";
import type { CheckNoteResponse } from "../types";

interface AICheckNoteProps {
  noteData: {
    selectedFields: Record<string, unknown>;
    therapy: string[];
    followUp: string | null;
    selectedTemplate: { name: string; region: string } | null;
    side?: string;
  };
}

const AICheckNote = ({ noteData }: AICheckNoteProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckNoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!noteData.selectedTemplate) {
      setError("Please select a procedure first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const checkData = {
        procedure_name: noteData.selectedTemplate.name,
        region: noteData.selectedTemplate.region,
        side: noteData.side || "na",
        selected_fields: noteData.selectedFields,
        therapy: noteData.therapy,
        follow_up: noteData.followUp || "",
      };

      const response = await aiApi.checkNote(checkData);
      setResult(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="label">AI Check Note</p>
        <h3 className="text-lg font-semibold text-slate-900">Validate Note Quality</h3>
        <p className="mt-1 text-sm text-slate-600">
          Check for contradictions, missing information, and inconsistencies.
        </p>
      </div>

      <button onClick={handleCheck} disabled={loading} className="btn-secondary w-full">
        {loading ? "Checking..." : "AI Check Note"}
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-4 rounded-lg border px-4 py-3 ${getScoreBg(result.score)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">Quality Score</span>
            <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>{result.score}/100</span>
          </div>

          {result.warnings.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-900 mb-2">Warnings:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {result.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-sm text-green-700 font-medium">✓ No issues detected. Note looks good!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AICheckNote;
