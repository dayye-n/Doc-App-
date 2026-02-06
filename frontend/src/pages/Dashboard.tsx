import { useEffect, useMemo, useState } from "react";
import ProcedurePanel from "../components/ProcedurePanel";
import ThreeDHead from "../components/ThreeDHead";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { Note, Patient, ProcedureTemplate, TherapyOption } from "../types";

const therapyOptions: TherapyOption[] = ["dressing change", "follow-up in X days", "antibiotics", "pain management"];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    patient_id: "",
    full_name: "",
    date_of_birth: "",
    notes: "",
  });

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcedureTemplate | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, any>>({});
  const [therapy, setTherapy] = useState<TherapyOption[]>([]);
  const [followUp, setFollowUp] = useState("Follow-up in 7 days");
  const [encounterDate, setEncounterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [noteText, setNoteText] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.patient_id.toLowerCase().includes(q),
    );
  }, [patientSearch, patients]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadTemplates(selectedRegion);
    } else {
      setTemplates([]);
    }
    setSelectedTemplate(null);
    setSelectedFields({});
    setNoteId(null);
    setNoteText("");
  }, [selectedRegion]);

  const loadPatients = async () => {
    const res = await api.get<Patient[]>("/patients");
    setPatients(res.data);
    if (!selectedPatient && res.data.length > 0) {
      setSelectedPatient(res.data[0]);
    }
  };

  const loadTemplates = async (region: string) => {
    const res = await api.get<ProcedureTemplate[]>("/templates", { params: { region } });
    setTemplates(res.data);
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.patient_id || !newPatient.full_name) return;
    const payload = {
      ...newPatient,
      date_of_birth: newPatient.date_of_birth || null,
      notes: newPatient.notes || null,
    };
    const res = await api.post<Patient>("/patients", payload);
    setPatients((prev) => [res.data, ...prev]);
    setSelectedPatient(res.data);
    setNewPatient({ patient_id: "", full_name: "", date_of_birth: "", notes: "" });
    setStatus("Patient created");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleTemplateSelect = (tpl: ProcedureTemplate) => {
    setSelectedTemplate(tpl);
    const defaults: Record<string, any> = {};
    tpl.fields.forEach((f) => {
      defaults[f.name] = f.type === "checkbox" ? false : "";
    });
    setSelectedFields(defaults);
    setNoteText("");
    setNoteId(null);
  };

  const toggleTherapy = (option: TherapyOption) => {
    setTherapy((prev) => (prev.includes(option) ? prev.filter((t) => t !== option) : [...prev, option]));
  };

  const handleFieldChange = (name: string, value: any) => {
    setSelectedFields((prev) => ({ ...prev, [name]: value }));
  };

  const generateNote = async () => {
    if (!selectedPatient || !selectedTemplate) {
      setStatus("Select a patient, region, and procedure first.");
      return;
    }
    setLoadingNote(true);
    setStatus(null);
    try {
      const res = await api.post<Note>("/notes", {
        patient_id: selectedPatient.id,
        template_id: selectedTemplate.id,
        encounter_date: encounterDate,
        selected_fields: selectedFields,
        therapy,
        follow_up: followUp,
        final_text: noteText || undefined,
      });
      setNoteText(res.data.final_text);
      setNoteId(res.data.id);
      setStatus("Note generated and saved");
    } catch (err) {
      console.error(err);
      setStatus("Unable to generate note. Check required fields.");
    } finally {
      setLoadingNote(false);
    }
  };

  const saveEditedNote = async () => {
    if (!noteId) return;
    setLoadingNote(true);
    try {
      const res = await api.put<Note>(`/notes/${noteId}`, {
        final_text: noteText,
        therapy,
        follow_up: followUp,
        selected_fields: selectedFields,
      });
      setNoteText(res.data.final_text);
      setStatus("Note updated");
    } catch (err) {
      console.error(err);
      setStatus("Unable to update note");
    } finally {
      setLoadingNote(false);
    }
  };

  const copyNote = async () => {
    if (!noteText) return;
    await navigator.clipboard.writeText(noteText);
    setStatus("Copied to clipboard");
    setTimeout(() => setStatus(null), 2000);
  };

  const downloadPdf = async () => {
    if (!noteId) {
      setStatus("Save a note before exporting PDF");
      return;
    }
    const res = await api.post(`/notes/${noteId}/pdf`, {}, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `note-${noteId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">ENT Note Builder</div>
          <h1 className="text-xl font-bold text-slate-900">Generate structured notes in clicks</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="font-semibold text-slate-900">{user?.email}</div>
            <div className="text-xs text-slate-500">Doctor</div>
          </div>
          <button onClick={logout} className="btn-secondary">
            Log out
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        {status && <div className="mb-4 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">{status}</div>}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="label">Patients</p>
                <h2 className="text-lg font-semibold text-slate-900">Select or create</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {patients.length} records
              </span>
            </div>
            <input
              className="input mt-4"
              placeholder="Search patient id or name"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedPatient?.id === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="text-xs text-slate-500">
                    ID: {p.patient_id} {p.date_of_birth ? `- DOB ${p.date_of_birth}` : ""}
                  </div>
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  No patients yet.
                </div>
              )}
            </div>
            <hr className="my-4 border-slate-200" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">New patient</h3>
              <form className="mt-2 space-y-3" onSubmit={handlePatientSubmit}>
                <div>
                  <label className="label">Patient ID</label>
                  <input
                    className="input mt-1"
                    value={newPatient.patient_id}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, patient_id: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Full name</label>
                  <input
                    className="input mt-1"
                    value={newPatient.full_name}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Date of birth</label>
                  <input
                    className="input mt-1"
                    type="date"
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input mt-1"
                    rows={2}
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Add patient
                </button>
              </form>
            </div>
          </section>

          <section className="lg:col-span-2 space-y-5">
            <ThreeDHead selectedRegion={selectedRegion as any} onSelect={(r) => setSelectedRegion(r)} />
            <ProcedurePanel
              templates={templates}
              selectedTemplateId={selectedTemplate?.id ?? null}
              onSelect={handleTemplateSelect}
            />

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label">Procedure details</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedTemplate ? selectedTemplate.name : "Choose a procedure"}
                  </h3>
                </div>
                <div className="text-xs text-slate-500">
                  Encounter date
                  <input
                    type="date"
                    className="input mt-1"
                    value={encounterDate}
                    onChange={(e) => setEncounterDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedTemplate ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name}>
                      <label className="label">{field.label}</label>
                      {field.type === "dropdown" && (
                        <select
                          className="input mt-1"
                          value={selectedFields[field.name] ?? ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        >
                          <option value="">Select</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {field.type === "text-short" && (
                        <input
                          className="input mt-1"
                          value={selectedFields[field.name] ?? ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder="Enter text"
                        />
                      )}
                      {field.type === "checkbox" && (
                        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <input
                            id={field.name}
                            type="checkbox"
                            checked={Boolean(selectedFields[field.name])}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                          />
                          <label htmlFor={field.name} className="text-sm text-slate-700">
                            {field.label}
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Pick a procedure to see its fields.
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Therapy & follow-up</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {therapyOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleTherapy(opt)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          therapy.includes(opt)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input mt-3"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Follow-up instructions"
                  />
                </div>
                <div>
                  <label className="label">Selected patient</label>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    {selectedPatient ? (
                      <>
                        <div className="font-semibold text-slate-900">{selectedPatient.full_name}</div>
                        <div className="text-xs text-slate-600">ID: {selectedPatient.patient_id}</div>
                        {selectedPatient.date_of_birth && (
                          <div className="text-xs text-slate-500">DOB: {selectedPatient.date_of_birth}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500">Choose a patient to continue.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label">Final note</p>
                  <h3 className="text-lg font-semibold text-slate-900">Review & export</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyNote} className="btn-secondary" disabled={!noteText}>
                    Copy
                  </button>
                  <button onClick={downloadPdf} className="btn-primary" disabled={!noteId}>
                    Download PDF
                  </button>
                </div>
              </div>

              <textarea
                className="input mt-3 h-56 whitespace-pre-wrap font-mono text-sm"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Generate a note to see preview..."
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={generateNote} className="btn-primary" disabled={loadingNote}>
                  {noteId ? "Regenerate note" : "Generate & save note"}
                </button>
                <button onClick={saveEditedNote} className="btn-secondary" disabled={!noteId || loadingNote}>
                  Save edited note
                </button>
                {noteId && <span className="text-xs text-slate-500">Note ID: {noteId}</span>}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
