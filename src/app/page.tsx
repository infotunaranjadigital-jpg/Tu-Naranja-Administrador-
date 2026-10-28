'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginView from '@/components/LoginView';
import DashboardView from '@/components/DashboardView';
import ClientsView from '@/components/ClientsView';
import NewEmissionView from '@/components/NewEmissionView';
import DocumentsView from '@/components/DocumentsView';
import ReportsView from '@/components/ReportsView';
import TeamView from '@/components/TeamView';
import RateBarModal from '@/components/RateBarModal';
import FormaLibrePrint from '@/components/FormaLibrePrint';
import ReceiptPrint from '@/components/ReceiptPrint';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App state
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [rates, setRates] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);

  // Emission / Print state
  const [selectedClientForEmission, setSelectedClientForEmission] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

  // Check auth
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      setRates(data.current || null);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchRates();
  }, []);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchDocuments();
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setViewingDocument(null);
  };

  const handleEmitForClient = (client: any) => {
    setSelectedClientForEmission(client);
    setViewingDocument(null);
    setCurrentTab('new-emission');
  };

  const handleEmissionSuccess = (createdDoc: any) => {
    fetchDocuments();
    setViewingDocument(createdDoc);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 animate-pulse flex items-center justify-center text-2xl">
            🍊
          </div>
          <span className="text-xs text-slate-400 font-mono">Cargando Tu Naranja Digital...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  // If currently viewing a document for printing
  if (viewingDocument) {
    if (viewingDocument.doc_type === 'FORMA_LIBRE') {
      return (
        <FormaLibrePrint 
          document={viewingDocument} 
          onBack={() => setViewingDocument(null)} 
        />
      );
    } else {
      return (
        <ReceiptPrint 
          document={viewingDocument} 
          onBack={() => setViewingDocument(null)} 
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setViewingDocument(null);
          setCurrentTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        rates={rates}
        onRefreshRates={fetchRates}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            clients={clients}
            documents={documents}
            rates={rates}
            onEmitForClient={handleEmitForClient}
            onViewDocument={(doc) => setViewingDocument(doc)}
            onTabChange={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'clients' && (
          <ClientsView
            clients={clients}
            onEmitForClient={handleEmitForClient}
            onRefreshClients={fetchClients}
          />
        )}

        {currentTab === 'new-emission' && (
          <NewEmissionView
            clients={clients}
            rates={rates}
            initialClient={selectedClientForEmission}
            onEmissionSuccess={handleEmissionSuccess}
          />
        )}

        {currentTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onViewDocument={(doc) => setViewingDocument(doc)}
            onRefreshDocuments={fetchDocuments}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView />
        )}

        {currentTab === 'team' && (
          <TeamView />
        )}
      </main>

      <RateBarModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={rates}
        onRatesUpdated={(newRate) => {
          setRates(newRate);
          fetchRates();
        }}
      />
    </div>
  );
}
