import axios, { AxiosError } from "axios";
import api from "../api/client";
import type { CheckNoteResponse, ParsedNoteResponse, PatientInstructionsResponse } from "../types";

// Error handler utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return axiosError.response?.data?.detail || axiosError.message || "An error occurred";
  }
  return "An unexpected error occurred";
};

// AI API helpers
export const aiApi = {
  parseNote: async (text: string): Promise<ParsedNoteResponse> => {
    const response = await api.post<ParsedNoteResponse>("/ai/parse-note", { text });
    return response.data;
  },

  checkNote: async (noteData: Record<string, unknown>): Promise<CheckNoteResponse> => {
    const response = await api.post<CheckNoteResponse>("/ai/check-note", { note_data: noteData });
    return response.data;
  },

  generatePatientInstructions: async (noteData: Record<string, unknown>): Promise<PatientInstructionsResponse> => {
    const response = await api.post<PatientInstructionsResponse>("/ai/patient-instructions", {
      note_data: noteData,
    });
    return response.data;
  },
};

export default api;

