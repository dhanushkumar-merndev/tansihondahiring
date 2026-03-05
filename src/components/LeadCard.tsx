"use client";

import React, { useState, useRef } from "react";

export interface Lead {
  rowIndex: number;
  created_time: string;
  position: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  feedback: string;
  interested: string;
  inprocess: string;
  updated_time?: string;
}

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, "0");

  return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
};

interface LeadCardProps {
  lead: Lead;
  onRefresh: () => void;
  hideCalledBadge?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onRefresh,
  hideCalledBadge,
}) => {
  const [feedback, setFeedback] = useState(lead.feedback || "");
  const [selectedStatus, setSelectedStatus] = useState(lead.status);
  const [selectedInterested, setSelectedInterested] = useState(
    lead.interested || "",
  );
  const [inProcess, setInProcess] = useState<string | "">(lead.inprocess || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const prevLeadRef = useRef(lead);

  // Sync local state when lead prop changes (Soft Sync)
  React.useEffect(() => {
    const prevLead = prevLeadRef.current;

    // Only update if local state hasn't been modified by user (matches previous prop)
    // or if we just performed a save on THIS card.
    if (justSaved || feedback === (prevLead.feedback || "")) {
      setFeedback(lead.feedback || "");
    }
    if (justSaved || selectedStatus === prevLead.status) {
      setSelectedStatus(lead.status);
    }
    if (justSaved || selectedInterested === (prevLead.interested || "")) {
      setSelectedInterested(lead.interested || "");
    }
    if (justSaved || inProcess === (prevLead.inprocess || "")) {
      setInProcess(lead.inprocess || "");
    }

    setJustSaved(false);
    prevLeadRef.current = lead;
  }, [lead]);

  const handleSave = async () => {
    if (!feedback.trim()) {
      setError("Feedback is mandatory");
      return;
    }

    setError(null);
    setIsSaving(true);

    // Optimistic update is already handled by the local state
    // being controlled by the user's interactions before Save.
    // However, we want to ensure the UI feels "saved" immediately.

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: lead.rowIndex,
          status: selectedStatus,
          feedback,
          interested: selectedInterested,
          inprocess: inProcess,
          updated_time: formatDate(new Date()),
        }),
      });

      if (res.ok) {
        setJustSaved(true);
        // Refresh parent to sync with "source of truth"
        onRefresh();
      } else {
        setError("Failed to save to Google Sheets");
        // Optional: rollback if we strictly followed an optimistic pattern
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors: { [key: string]: string } = {
    Pending: "bg-red-50 text-red-600 border-red-100",
    Rejected: "bg-red-600 text-white border-red-600",
    Called: "bg-blue-50 text-blue-600 border-blue-100",
  };

  const isStatusCalled =
    lead.status.toLowerCase() === "called" ||
    selectedStatus.toLowerCase() === "called";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-full transition-all hover:shadow-md hover:border-red-200 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="text-lg font-black text-slate-900 leading-tight uppercase group-hover:text-red-600 transition-colors truncate"
            title={lead.full_name}
          >
            {lead.full_name}
          </h3>
          <p className="text-[10px] font-black text-red-600 mt-1.5 uppercase tracking-widest truncate">
            {lead.position}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {inProcess === "Yes" && (
            <span className="flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-colors shadow-sm bg-purple-50 text-purple-600 border-purple-100">
              In Process
            </span>
          )}

          {!(isStatusCalled && (hideCalledBadge || inProcess === "Yes")) && (
            <span
              className={`flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-colors shadow-sm ${
                statusColors[selectedStatus] || "bg-slate-50 text-slate-600"
              }`}
            >
              {selectedStatus}
            </span>
          )}

          {selectedInterested &&
            !(selectedStatus === "Rejected" || selectedStatus === "Reject") && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  selectedInterested === "Yes"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 text-slate-400 border-slate-100"
                }`}
              >
                {selectedInterested === "Yes"
                  ? "✓ INTERESTED"
                  : "✗ NOT INTERESTED"}
              </span>
            )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2.5 mb-5 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <a
            href={`tel:${lead.phone}`}
            className="font-bold text-slate-600 text-xs hover:text-red-600 transition-colors"
          >
            {lead.phone}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <a
            href={`mailto:${lead.email}`}
            className="font-bold text-slate-600 text-xs truncate hover:text-red-600 transition-colors max-w-[150px]"
          >
            {lead.email}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="font-bold text-slate-600 text-xs">
            {lead.created_time}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-3">
        {error && (
          <p className="text-[10px] font-bold text-red-600 uppercase text-center">
            {error}
          </p>
        )}

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full p-3 text-[11px] font-black bg-red-50/30 border border-red-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/20 resize-none h-16 text-red-600"
          placeholder="Contact notes (Mandatory)..."
        />

        {/* Interested Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest shrink-0">
            Interested?
          </span>

          <div className="flex gap-1.5 flex-1">
            {["INTERESTED", "NOT INTERESTED"].map((opt) => {
              const value = opt === "INTERESTED" ? "Yes" : "No";
              const isDisabled =
                (opt === "INTERESTED" && selectedStatus === "Reject") ||
                (opt === "NOT INTERESTED" && inProcess === "Yes");

              return (
                <button
                  key={opt}
                  disabled={isDisabled}
                  onClick={() =>
                    setSelectedInterested((prev) =>
                      prev === value ? "" : value,
                    )
                  }
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                    selectedInterested === value
                      ? value === "Yes"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-400 scale-[1.02] shadow-sm"
                        : "bg-red-50 text-red-600 border-red-400 scale-[1.02] shadow-sm"
                      : isDisabled
                        ? "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed opacity-60"
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setInProcess((prev) => {
                const newValue = prev === "Yes" ? "" : "Yes";
                if (newValue === "Yes") {
                  setSelectedStatus("Called");
                  // Clear NOT INTERESTED if it was selected
                  setSelectedInterested((curr) => (curr === "No" ? "" : curr));
                } else {
                  // If deselected, reset to Pending if it was Called
                  setSelectedStatus((current) =>
                    current === "Called" ? "Pending" : current,
                  );
                }
                return newValue;
              });
            }}
            className={`w-full py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
              inProcess === "Yes"
                ? "bg-white text-red-600 border-red-500 shadow-sm scale-[1.02]"
                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
            }`}
          >
            {inProcess === "Yes" ? "✓ IN PROCESS" : "✗ NOT IN PROCESS"}
          </button>

          <button
            key="Reject"
            onClick={() => {
              setSelectedStatus((prev) => {
                const isRejecting = prev !== "Reject";
                if (isRejecting) {
                  setInProcess(""); // Clear In Process when Rejecting
                  // Only deselect if it was "Yes"
                  setSelectedInterested((curr) => (curr === "Yes" ? "" : curr));
                  return "Reject";
                }
                return "Pending";
              });
            }}
            className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
              selectedStatus === "Reject"
                ? "bg-red-600 text-white border-red-600 shadow-lg scale-[1.02]"
                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
            }`}
          >
            Reject
          </button>
        </div>
        {/* In Process Toggle */}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 text-[11px] font-black uppercase tracking-widest rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save to Google Sheet"}
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
