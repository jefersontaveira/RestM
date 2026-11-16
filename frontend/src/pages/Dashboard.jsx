import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Users
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [tables, setTables] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'livres', 'ocupadas'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const carregarMesas = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const response = await api.get('mesas/');
      setTables(response.data);
    } catch (error) {
      console.error("Erro ao buscar mesas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarMesas();
  }, []);

  const totalMesas = tables.length;
  const mesasLivres = tables.filter(t => (t.status || '').toLowerCase() === 'livre').length;
  const mesasOcupadas = tables.filter(t => (t.status || '').toLowerCase() === 'ocupada').length;

  const mesasFiltradas = tables.filter(t => {
    const st = (t.status || '').toLowerCase();
    if (filtroStatus === 'livres') return st === 'livre';
    if (filtroStatus === 'ocupadas') return st === 'ocupada';
    return true;
  });

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col">
      {/* Cabeçalho da Tela com Métricas de Ocupação em Tempo Real */}
      <header className="mb-6 sm:mb-8 border-b border-dark-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0 shadow-sm">
                <LayoutGrid size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Controle de Mesas
              </h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Toque ou clique em uma mesa para iniciar atendimento ou lançar comandas.
            </p>
          </div>

          {/* Botão de Atualizar Rápido */}
          <button
            onClick={() => carregarMesas(true)}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-gold-500/40 text-gray-300 hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Atualizar status das mesas"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-gold-500' : 'text-gray-400'} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* --- CARDS DE RESUMO OPERACIONAL & FILTROS (100% RESPONSIVO) --- */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Card: Total */}
          <button
            type="button"
            onClick={() => setFiltroStatus('todas')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filtroStatus === 'todas'
                ? 'bg-zinc-800/90 border-gold-500 ring-2 ring-gold-500/20 shadow-md'
                : 'bg-dark-card border-dark-border hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold text-gray-400 tracking-wider">
                Total
              </span>
              <Users size={16} className="text-gray-500 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-3xl font-black text-white font-mono mt-1">
              {totalMesas}
            </p>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
              Mesas cadastradas
            </span>
          </button>

          {/* Card: Livres */}
          <button
            type="button"
            onClick={() => setFiltroStatus('livres')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filtroStatus === 'livres'
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : 'bg-dark-card border-dark-border hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                Livres
              </span>
              <CheckCircle2 size={16} className="text-emerald-400 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
              {mesasLivres}
            </p>
            <span className="text-[10px] sm:text-xs text-emerald-500/70 font-medium hidden sm:block">
              Prontas para receber
            </span>
          </button>

          {/* Card: Ocupadas */}
          <button
            type="button"
            onClick={() => setFiltroStatus('ocupadas')}
            className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filtroStatus === 'ocupadas'
                ? 'bg-amber-950/40 border-gold-500 ring-2 ring-gold-500/20 shadow-md'
                : 'bg-dark-card border-dark-border hover:border-gold-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold text-gold-500 tracking-wider">
                Ocupadas
              </span>
              <Clock size={16} className="text-gold-500 hidden sm:block" />
            </div>
            <p className="text-xl sm:text-3xl font-black text-gold-400 font-mono mt-1">
              {mesasOcupadas}
            </p>
            <span className="text-[10px] sm:text-xs text-gold-500/70 font-medium hidden sm:block">
              Em atendimento
            </span>
          </button>
        </div>
      </header>

      {/* --- GRID DE MESAS OPERACIONAIS --- */}
      {loading ? (
        <div className="text-center py-20 text-gold-500 font-bold animate-pulse">
          Carregando salão e mesas...
        </div>
      ) : mesasFiltradas.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pb-12">
          {mesasFiltradas.map(table => {
            const isOcupada = (table.status || '').toLowerCase() === 'ocupada';

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => navigate(`/mesa/${table.id}`)}
                className={`
                  p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-between transition-all duration-200
                  min-h-[120px] sm:min-h-[140px] text-center active:scale-95 cursor-pointer relative overflow-hidden group
                  ${isOcupada
                    ? 'bg-dark-card border-2 border-gold-500/80 hover:border-gold-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-dark-card border-2 border-dark-border hover:border-emerald-500/50 shadow-sm'
                  }
                `}
              >
                {/* Indicador de Status no topo do card */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isOcupada
                        ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOcupada ? 'bg-gold-500 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    {isOcupada ? 'Ocupada' : 'Livre'}
                  </span>

                  <span className="text-[10px] font-mono text-gray-500">
                    #{table.id}
                  </span>
                </div>

                {/* Identificação Principal da Mesa */}
                <div className="my-auto">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight block ${
                      isOcupada ? 'text-gold-400 group-hover:text-gold-300' : 'text-white'
                    }`}
                  >
                    {table.identification}
                  </span>
                </div>

                {/* Rodapé do Card */}
                <div className="w-full pt-2 border-t border-dark-border/60">
                  <span
                    className={`text-[10px] sm:text-xs font-bold block truncate ${
                      isOcupada ? 'text-gold-500' : 'text-gray-400'
                    }`}
                  >
                    {isOcupada ? 'Ver Comanda →' : 'Abrir Mesa →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-gray-500">
            <LayoutGrid size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhuma mesa encontrada neste filtro
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-6 max-w-sm mx-auto">
            {filtroStatus !== 'todas'
              ? 'Tente selecionar o filtro "Total" para visualizar todas as mesas cadastradas.'
              : 'Você ainda não cadastrou mesas no salão. Acesse a Gestão para adicionar mesas.'}
          </p>

          <button
            onClick={() => setFiltroStatus('todas')}
            className="bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md"
          >
            Ver Todas as Mesas
          </button>
        </div>
      )}
    </div>
  );
}
