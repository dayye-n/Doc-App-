import { useState } from "react";
import { aiApi, handleApiError } from "../lib/api";
import type { ParsedNoteResponse } from "../types";

interface AIAssistantProps {
  onNoteParsed: (parsed: ParsedNoteResponse) => void;
}

const AIAssistant = ({ onNoteParsed }: AIAssistantProps) => {
  const [dictationText, setDictationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!dictationText.trim()) {
      setError("Please enter some text to parse");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await aiApi.parseNote(dictationText);
      onNoteParsed(result);
      setDictationText(""); // Clear after successful parse
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="label">AI Assistant</p>
        <h3 className="text-lg font-semibold text-slate-900">Parse Dictation to Structured Note</h3>
        <p className="mt-1 text-sm text-slate-600">
          Paste your dictation or transcript text below, and AI will extract structured information.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <textarea
        className="input mt-3 h-32 font-mono text-sm"
        value={dictationText}
        onChange={(e) => setDictationText(e.target.value)}
        placeholder="Paste dictation text here... e.g., 'Patient presents with recurrent tonsillitis on the left side. Enlarged tonsils with inflammation. Recommend tonsillectomy. Prescribe antibiotics and pain management. Follow-up in 7 days.'"
      />

      <button
        onClick={handleParse}
        disabled={loading || !dictationText.trim()}
        className="btn-primary mt-3 w-full"
      >
        {loading ? "Generating..." : "Generate Structured Note"}
      </button>
    </div>
  );
};

export default AIAssistant;
