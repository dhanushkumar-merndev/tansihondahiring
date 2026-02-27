'use client';

import React, { useState } from 'react';

export interface Lead {
  rowIndex: number;
  created_time: string;
  position: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  feedback: string;
}

interface LeadCardProps {
  lead: Lead;
  onRefresh: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onRefresh }) => {
  const [feedback, setFeedback] = useState(lead.feedback || '');
  const [selectedStatus, setSelectedStatus] = useState(lead.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!feedback.trim()) {
      setError('Feedback is mandatory');
      return;
    }
    if (!selectedStatus) {
      setError('Status is mandatory');
      return;
    }
    
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: lead.rowIndex,
          status: selectedStatus,
          feedback: feedback,
        }),
      });

      if (res.ok) {
        onRefresh();
      } else {
        setError('Failed to save to Google Sheets');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Network error. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors: { [key: string]: string } = {
    Pending: 'bg-red-50 text-red-600 border-red-100',
    Called: 'bg-slate-900 text-white border-slate-900',
    Rejected: 'bg-red-600 text-white border-red-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-full transition-all hover:shadow-md hover:border-red-200 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 pb-0.5 leading-tight group-hover:text-red-600 transition-colors uppercase">{lead.full_name}</h3>
          <p className="text-[10px] font-black text-red-600 mt-1.5 uppercase tracking-widest">{lead.position}</p>
        </div>
        <span className={`flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-colors shadow-sm ${statusColors[lead.status] || 'bg-slate-50 text-slate-600'}`}>
          {lead.status}
        </span>
      </div>

      <div className="space-y-2.5 mb-5 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <a href={`tel:${lead.phone}`} className="font-bold text-slate-600 text-xs hover:text-red-600 transition-colors">{lead.phone}</a>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <a href={`mailto:${lead.email}`} className="font-bold text-slate-600 text-xs truncate hover:text-red-600 transition-colors max-w-[150px]">{lead.email}</a>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-600 text-xs truncate hover:text-red-600 transition-colors max-w-[150px]">{lead.created_time}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {error && (
          <p className="text-[10px] font-bold text-red-600 uppercase text-center animate-bounce">{error}</p>
        )}
        
        <textarea
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            if (error) setError(null);
          }}
          className={`w-full p-3 text-[11px] font-black bg-red-50/30 border rounded-xl focus:outline-none focus:ring-1 transition-all resize-none h-16 ${error === 'Feedback is mandatory' ? 'border-red-500 ring-red-500/20' : 'border-red-100 focus:ring-red-500/20 focus:border-red-500'} text-red-600`}
          placeholder="Contact notes (Mandatory)..."
        />

        <div className="grid grid-cols-2 gap-2">
          {['Called', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                selectedStatus === status
                  ? status === 'Called' ? 'bg-slate-900 text-white border-slate-900 scale-[1.02]' : 'bg-red-600 text-white border-red-600 scale-[1.02]'
                  : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
              }`}
            >
              {status === 'Rejected' ? 'Reject' : status}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 text-[11px] font-black uppercase tracking-widest rounded-xl bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all flex items-center justify-center gap-2 group/save shadow-md disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {isSaving ? 'Saving...' : 'Save to Google Sheet'}
        </button>

      </div>
    </div>
  );
};

export default LeadCard;
