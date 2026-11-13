'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, Download, Link2, 
  MessageSquare, Heart, TrendingUp, Users, Eye, 
  Smile, Meh, Frown, ShoppingBag, CheckCircle, 
  Calendar, AlertCircle, ArrowUpRight, Sparkles, Printer, Camera
} from 'lucide-react';

interface SocialReportsViewProps {
  clients: any[];
}

export default function SocialReportsView({ clients }: SocialReportsViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('tu-naranja-digital');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().slice(0, 7));
  const [accountsData, setAccountsData] = useState<any>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Link modal state
  const [linkComposioId, setLinkComposioId] = useState('');
  const [linkInstagramUser, setLinkInstagramUser] = useState('');
  const [linkStartDate, setLinkStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Fetch accounts and reports
  const fetchAccountsAndCurrentReport = async () => {
    setIsLoading(true);
    try {
      const accRes = await fetch('/api/social/accounts');
      const accData = await accRes.json();
      if (accData.success) {
        setAccountsData(accData);
      }

      const repRes = await fetch(`/api/social/reports?client_id=${selectedClientId}&period=${selectedPeriod}`);
      const repData = await repRes.json();
      if (repData.success && repData.reports?.length > 0) {
        setCurrentReport(repData.reports[0]);
      } else {
        setCurrentReport(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndCurrentReport();
  }, [selectedClientId, selectedPeriod]);

  const selectedClient = clients.find(c => c.id === selectedClientId) || {
    id: selectedClientId,
    name: 'Tu Naranja Digital (Agencia)',
    instagram_username: 'tunaranjadigital'
  };

  const handleSyncMetrics = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/social/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          period: selectedPeriod
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentReport(data.report);
      } else {
        alert('Error al sincronizar métricas: ' + data.error);
      }
    } catch (e: any) {
      alert('Error de conexión: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/social/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          composioAccountId: linkComposioId,
          instagramUsername: linkInstagramUser,
          customStartDate: linkStartDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsLinkModalOpen(false);
        fetchAccountsAndCurrentReport();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Métricas & Reportes de Redes Sociales
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Composio AI Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Auditoría mensual, KPIs reales de Instagram y análisis cualitativo de sentimiento en comentarios y mensajes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Client Selector */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
          >
            <option value="tu-naranja-digital">🍊 Tu Naranja Digital (Agencia)</option>
            {clients.filter(c => c.id !== 'tu-naranja-digital').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Period Selector */}
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
          />

          {/* Link Account Button */}
          <button
            onClick={() => {
              setLinkComposioId(selectedClient.composio_account_id || '');
              setLinkInstagramUser(selectedClient.instagram_username || '');
              setIsLinkModalOpen(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Link2 className="w-3.5 h-3.5 text-orange-400" />
            Vincular Cuenta
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSyncMetrics}
            disabled={isSyncing}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Analizando...' : 'Sincronizar Mes'}
          </button>

          {/* Download PDF Button */}
          {currentReport && (
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-600 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Account Linked & Baseline Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">@{selectedClient.instagram_username || 'tunaranjadigital'}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" /> Conexión Activa
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inicio de gestión: <span className="text-slate-200 font-semibold">{selectedClient.social_start_date || 'Noviembre 2026'}</span>
            </p>
          </div>
        </div>

        {/* Baseline stats comparison */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Seguidores de Partida</span>
            <span className="font-mono font-bold text-slate-200 text-xs">
              {(selectedClient.initial_followers || 2903).toLocaleString('es-VE')}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Crecimiento Neto</span>
            <span className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{(Math.max(0, (currentReport?.followers_count || 2903) - (selectedClient.initial_followers || 2903))).toLocaleString('es-VE')}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Período</span>
            <span className="font-mono font-bold text-amber-400 text-xs">
              {selectedPeriod}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
          Cargando informe mensual...
        </div>
      ) : !currentReport ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto text-2xl">
            📊
          </div>
          <h2 className="text-base font-bold text-white">No hay informe generado para {selectedPeriod}</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Aún no has sincronizado las métricas para este cliente en el período seleccionado. Haz clic en el botón para consultar Composio y generar el reporte completo.
          </p>
          <button
            onClick={handleSyncMetrics}
            disabled={isSyncing}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 inline-flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            {isSyncing ? 'Extrayendo Métricas...' : 'Generar Informe con IA'}
          </button>
        </div>
      ) : (
        <div id="printable-social-report" className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/30 border border-orange-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Resumen Ejecutivo & Conclusiones del Mes (IA)
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {currentReport.executive_summary}
            </p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Comunidad / Seguidores</span>
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(currentReport.followers_count || 0).toLocaleString('es-VE')}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <CheckCircle className="w-3 h-3" /> Cuentas activas en Instagram
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Alcance Promedio (Reach)</span>
                <Eye className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(currentReport.reach_total || 0).toLocaleString('es-VE')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Cuentas únicas alcanzadas
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Interacciones Totales</span>
                <Heart className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {Number(currentReport.total_interactions || 0).toLocaleString('es-VE')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Likes, guardados y compartidos
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <span>Leads / Oportunidades</span>
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {currentReport.leads_intent_percent || 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Comentarios con intención de compra
              </div>
            </div>
          </div>

          {/* Sentiment Analysis Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  Análisis de Sentimiento de la Audiencia
                </h3>
                <p className="text-xs text-slate-400">
                  Clasificación semántica de comentarios e intenciones detectadas en el mes.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Positivo: {currentReport.sentiment_positive_percent}%
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Leads: {currentReport.leads_intent_percent}%
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Neutro: {currentReport.sentiment_neutral_percent}%
                </span>
              </div>
            </div>

            {/* Visual Sentiment Bar */}
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${currentReport.sentiment_positive_percent}%` }}
                className="bg-emerald-500 h-full transition-all duration-500" 
                title={`Positivo: ${currentReport.sentiment_positive_percent}%`}
              />
              <div 
                style={{ width: `${currentReport.leads_intent_percent}%` }}
                className="bg-amber-500 h-full transition-all duration-500" 
                title={`Leads / Compra: ${currentReport.leads_intent_percent}%`}
              />
              <div 
                style={{ width: `${currentReport.sentiment_neutral_percent}%` }}
                className="bg-slate-600 h-full transition-all duration-500" 
                title={`Neutro: ${currentReport.sentiment_neutral_percent}%`}
              />
              <div 
                style={{ width: `${currentReport.sentiment_negative_percent}%` }}
                className="bg-red-500 h-full transition-all duration-500" 
                title={`Objeciones: ${currentReport.sentiment_negative_percent}%`}
              />
            </div>

            {/* Analyzed Comments Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Muestra de Comentarios e Interacciones Analizadas
              </h4>

              {(!currentReport.sentiment_breakdown || currentReport.sentiment_breakdown.length === 0) ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded-xl">
                  No se registraron comentarios de texto en las publicaciones analizadas de este ciclo.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentReport.sentiment_breakdown.map((comm: any, idx: number) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">@{comm.username}</span>
                        <div className="flex items-center gap-1.5">
                          {comm.intent === 'LEAD' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🔥 Lead / Cotización
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            comm.sentiment === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                            comm.sentiment === 'NEGATIVE' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {comm.sentiment}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 italic">
                        "{comm.text}"
                      </p>
                      <div className="text-[10px] text-slate-500">
                        {new Date(comm.timestamp).toLocaleString('es-VE')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Posts Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              Top Publicaciones del Período
            </h3>

            {(!currentReport.top_posts || currentReport.top_posts.length === 0) ? (
              <div className="text-xs text-slate-500 italic">No hay publicaciones disponibles para este mes.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentReport.top_posts.map((post: any) => (
                  <div key={post.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-slate-800 text-orange-400 uppercase font-mono">
                          {post.media_product_type || post.media_type}
                        </span>
                        <a 
                          href={post.permalink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-slate-400 hover:text-orange-400 flex items-center gap-1 text-[11px]"
                        >
                          Ver en IG <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-3 mb-3">
                        {post.caption || 'Sin texto descriptivo'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-pink-400 font-mono">
                          <Heart className="w-3.5 h-3.5" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 font-mono">
                          <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {post.timestamp ? new Date(post.timestamp).toLocaleDateString('es-VE') : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-orange-400" />
                Vincular Cuenta de Composio
              </h3>
              <button 
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cliente del Sistema
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedClient.name}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Conectada en Composio
                </label>
                <select
                  value={linkComposioId}
                  onChange={(e) => {
                    setLinkComposioId(e.target.value);
                    if (e.target.value === 'instagram_renish-capel') {
                      setLinkInstagramUser('tunaranjadigital');
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:border-orange-500"
                >
                  <option value="">Selecciona una cuenta...</option>
                  <option value="instagram_renish-capel">Instagram: Tu Naranja Digital (TND-renish-capel)</option>
                  {accountsData?.composioAccounts?.instagram?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.alias || acc.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Usuario de Instagram (@username)
                </label>
                <input
                  type="text"
                  value={linkInstagramUser}
                  onChange={(e) => setLinkInstagramUser(e.target.value)}
                  placeholder="ej. tunaranjadigital"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Inicio de Gestión (Punto de Partida)
                </label>
                <input
                  type="date"
                  value={linkStartDate}
                  onChange={(e) => setLinkStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:border-orange-500"
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-[11px] text-orange-200 leading-relaxed">
                <span className="font-bold text-orange-400 block mb-0.5">📸 Línea Base Automática:</span>
                Al guardar, Composio tomará una captura inicial de seguidores, seguidos y publicaciones. Esto servirá como el punto cero para medir el crecimiento neto en los informes mensuales.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-orange-600/30 transition"
                >
                  Guardar Vinculación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
