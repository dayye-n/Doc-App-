import { useState } from "react";
import { aiApi, handleApiError } from "../lib/api";
import type { PatientInstructionsResponse } from "../types";

interface PatientInstructionsProps {
  noteData: {
    selectedFields: Record<string, unknown>;
    therapy: string[];
    followUp: string | null;
    selectedTemplate: { name: string; region: string } | null;
    side?: string;
  };
}

const PatientInstructions = ({ noteData }: PatientInstructionsProps) => {
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState<PatientInstructionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!noteData.selectedTemplate) {
      setError("Please select a procedure first");
      return;
    }

    setLoading(true);
    setError(null);
    setInstructions(null);

    try {
      const checkData = {
        procedure_name: noteData.selectedTemplate.name,
        region: noteData.selectedTemplate.region,
        side: noteData.side || "na",
        selected_fields: noteData.selectedFields,
        therapy: noteData.therapy,
        follow_up: noteData.followUp || "",
      };

      const response = await aiApi.generatePatientInstructions(checkData);
      setInstructions(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!instructions) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Instructions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 30px; }
            .discharge { white-space: pre-line; line-height: 1.6; margin: 20px 0; }
            .red-flags { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .red-flags h3 { color: #dc2626; margin-top: 0; }
            .red-flags ul { margin: 10px 0; padding-left: 20px; }
            .follow-up { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Patient Discharge Instructions</h1>
          <div class="discharge">${instructions.discharge_text}</div>
          <div class="red-flags">
            <h3>⚠️ Red Flags - Seek Immediate Medical Attention If:</h3>
            <ul>
              ${instructions.red_flags.map((flag) => `<li>${flag}</li>`).join("")}
            </ul>
          </div>
          <div class="follow-up">
            <h3>📅 Follow-up</h3>
            <p>${instructions.follow_up}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="label">Patient Instructions Generator</p>
        <h3 className="text-lg font-semibold text-slate-900">Generate Discharge Instructions</h3>
        <p className="mt-1 text-sm text-slate-600">
          Create patient-friendly discharge instructions from your note.
        </p>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="btn-secondary w-full">
        {loading ? "Generating..." : "Generate Patient Instructions"}
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {instructions && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Discharge Instructions</h4>
            <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed">
              {instructions.discharge_text}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Red Flags</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              {instructions.red_flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📅 Follow-up</h4>
            <p className="text-sm text-blue-800">{instructions.follow_up}</p>
          </div>

          <button onClick={handlePrint} className="btn-primary w-full">
            Print Instructions
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientInstructions;
