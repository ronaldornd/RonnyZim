"use client";

import { useState } from "react";
import { readStreamableValue } from "@ai-sdk/rsc";
import { searchJobsAction, calculateMatchAction, saveTargetAction } from "@/app/actions/hunter";

export interface ScannedJob {
  id: string;
  title: string;
  url: string;
  summary: string;
  full_content: string;
  published_at: string;
  score?: number;
  reasoning?: string;
  missing_skills?: string[];
  strong_matches?: string[];
  isScoring?: boolean;
}

export function useJobScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedJobs, setScannedJobs] = useState<ScannedJob[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const startScan = async (query: string) => {
    setIsScanning(true);
    setScannedJobs([]);
    setError(null);
    setStatusMessage("UPLINK: Estabilizando conexões de mercado...");

    try {
      const formData = new FormData();
      formData.append("query", query);
      const { output } = await searchJobsAction(formData);

      for await (const chunk of readStreamableValue(output)) {
        if (chunk?.status === "SEARCHING") {
          setStatusMessage(chunk.message);
        } else if (chunk?.status === "FOUND") {
          const newJob: ScannedJob = { ...chunk.data, isScoring: true };
          setScannedJobs(prev => [...prev, newJob]);
          
          // Dispara o cálculo neural em background para esta vaga específica
          calculateNeural(newJob.id, newJob.full_content);
        } else if (chunk?.status === "COMPLETED") {
          setStatusMessage("VARREDURA COMPLETA: Alvos identificados.");
        }
      }
    } catch (err: any) {
      setError("UPLINK_FAILED: Falha na varredura.");
      setStatusMessage("ERROR: Conexão interrompida.");
    } finally {
      setIsScanning(false);
    }
  };

  const calculateNeural = async (jobId: string, content: string) => {
    try {
      const profileSummary = "Senior Software Engineer (Frontend) specializing in React, Next.js, and Framer Motion.";
      const analysis = await calculateMatchAction(content, profileSummary);
      
      setScannedJobs(prev => prev.map(job => 
        job.id === jobId 
        ? { ...job, ...analysis, isScoring: false } 
        : job
      ));
    } catch (err) {
      console.error(`Neural Analysis failed for ${jobId}`);
      setScannedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, isScoring: false } : job
      ));
    }
  };

  const saveToDossier = async (job: ScannedJob) => {
    try {
      await saveTargetAction(job);
      return true;
    } catch (err) {
      console.error("Failed to save job to dossier.");
      return false;
    }
  };

  return {
    isScanning,
    scannedJobs,
    statusMessage,
    error,
    startScan,
    saveToDossier
  };
}
