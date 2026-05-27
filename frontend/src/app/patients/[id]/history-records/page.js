'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import Link from 'next/link';
import { Clipboard, ArrowLeft, Clock, User, HeartPulse } from 'lucide-react';

export default function PatientHistoryRecords({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { token, API_BASE_URL } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (err) {
        console.error("Historical file tracking error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPatientData();
  }, [params.id, token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Return to Staff Console
        </Link>

        {loading ? (
          <p className="text-center text-slate-400 animate-pulse text-sm">Decoding matching clinical entries...</p>
        ) : !patient ? (
          <p className="text-center text-rose-500 text-sm">Error: Patient record file trace collapsed.</p>
        ) : (
          <div className="glass p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl"><Clipboard className="h-6 w-6" /></div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{patient.name}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Patient Diagnostic Dossier Matrix</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-500/5 p-4 rounded-xl">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> <span><strong>Age/Sex:</strong> {patient.age} years / {patient.gender}</span></div>
              <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-slate-400" /> <span><strong>Contact Cell:</strong> {patient.phoneNumber}</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock className="h-4 w-4" /> Historical Ledger Content</h3>
              <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 shadow-inner whitespace-pre-wrap leading-6">
                {patient.medicalHistory ? patient.medicalHistory : "SYSTEM STATUS WARNING: NO ANAMNESIS DECLARED FOR THIS IDENTIFIER."}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}