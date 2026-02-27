'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardStats from '@/components/DashboardStats';
import LeadCard, { Lead } from '@/components/LeadCard';
import Image from 'next/image';

const Home = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  useEffect(() => {
    let result = leads;
    
    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((lead) => lead.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (lead) => 
          lead.full_name.toLowerCase().includes(q) || 
          lead.position.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.email.toLowerCase().includes(q)
      );
    }

    // Sort by rowIndex ascending (First Come, First Served)
    result = [...result].sort((a, b) => a.rowIndex - b.rowIndex);
    
    setFilteredLeads(result);
  }, [leads, statusFilter, searchQuery]);

  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'Pending').length,
    called: leads.filter((l) => l.status === 'Called').length,
    rejected: leads.filter((l) => l.status === 'Rejected').length,
    rawLeads: leads // Passing raw leads for chart data
  };

  const tabs = ['All', 'Pending', 'Called', 'Rejected'];

  const [showLeadsMobile, setShowLeadsMobile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Compact Header */}
        <header className="bg-white rounded-2xl border border-slate-200 p-4 md:px-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {showLeadsMobile && (
              <button 
                onClick={() => setShowLeadsMobile(false)}
                className="p-2 sm:hidden bg-slate-50 rounded-xl border border-slate-200"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="w-14 h-14 mb-1 md:w-18 md:h-10rounded-lg flex items-center justify-center shrink-0">
              <Image src="/Tansi.png" alt="Logo" width={150} height={150} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">Tansi Motor</h1>
              <p className="text-[10px] md:text-xs font-bold text-red-600 uppercase tracking-widest mt-0.5">Hiring Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto -mt-4 md:mt-0">
            {/* Show search only on leads view on mobile, or always on desktop */}
            <div className={`relative flex-1 sm:w-64 max-w-sm`}>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-red-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right flex-col items-end flex">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Updated</p>
                <p className="text-xs font-black text-slate-600 tabular-nums">
                  {lastRefreshed || '--:--'}
                </p>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchLeads();
                }}
                className={`p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all ${loading ? 'animate-pulse' : ''}`}
                title="Refresh"
              >
                <svg className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard View (Stats + Graph) */}
        <div className={showLeadsMobile ? 'hidden sm:block' : 'block'}>
          <DashboardStats {...stats} />
          <div className="mt-6 sm:hidden">
            <button 
              onClick={() => setShowLeadsMobile(true)}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"
            >
              See All Applications
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Leads List View */}
        <div className={showLeadsMobile ? 'block' : 'hidden sm:block'}>
          {/* Compact Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-red-600 text-white shadow-lg shadow-red-100 scale-105'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-red-200 hover:bg-red-50/50'
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {filteredLeads.length} Candidates Found
            </div>
          </div>

          {loading && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin mb-4"></div>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Processing Data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.rowIndex} lead={lead} onRefresh={fetchLeads} />
              ))}
              {filteredLeads.length === 0 && (
                <div className="col-span-full bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">No matches found</h3>
                  <p className="text-sm text-slate-400 font-medium">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
