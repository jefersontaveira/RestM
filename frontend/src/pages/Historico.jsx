import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Lock, CreditCard, Banknote, QrCode, Coins } from 'lucide-react';
import api from '../services/api';

export default function Historico() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Paginação sob demanda
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarHistorico(true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const carregarHistorico = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const response = await api.get(
        `pedidos/?status=finalizado&search=${searchTerm}&limit=${LIMIT}&offset=${currentOffset}`
      );

      if (reset) {
        setPedidos(response.data);
        setOffset(LIMIT);
      } else {
        setPedidos(prev => [...prev, ...response.data]);
        setOffset(prev => prev + LIMIT);
      }

      if (response.data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMetodoBadge = (metodo) => {
    const metodos = {
      dinheiro: { label: 'Dinheiro', icon: <Banknote size={14} />, color: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' },
      pix: { label: 'PIX', icon: <QrCode size={14} />, color: 'bg-teal-900/30 text-teal-400 border-teal-500/30' },
      credito: { label: 'Cartão Crédito', icon: <CreditCard size={14} />, color: 'bg-sky-900/30 text-sky-400 border-sky-500/30' },
      debito: { label: 'Cartão Débito', icon: <CreditCard size={14} />, color: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' },
    };

    const cfg = metodos[metodo] || { label: 'Liquidado', icon: <Coins size={14} />, color: 'bg-green-900/30 text-green-400 border-green-500/30' };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col">
      {/* Botão Voltar Responsivo */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-gold-500 bg-dark-card border border-dark-border hover:border-gold-500/40 px-3.5 py-2 rounded-xl transition-all shadow-sm"
        >
          <span>←</span>
          <span>Voltar ao Mapa de Mesas</span>
        </button>
      </div>

      {/* Cabeçalho */}
      <header className="mb-6 border-b border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Histórico de Pedidos
            </h1>
            <span className="inline-flex items-center gap-1 bg-gold-500/10 border border-gold-500/30 text-gold-500 text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold">
              <ShieldCheck size={14} />
              Registro Protegido
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Dados congelados e imutáveis. O histórico permanece 100% íntegro mesmo se produtos ou mesas forem alterados.
          </p>
        </div>
      </header>

      {/* Barra de Pesquisa */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar por cliente, mesa ou código do pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-xl py-3 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 transition-colors shadow-sm"
        />
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 pb-10">
        {pedidos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 mb-8">
              {pedidos.map(pedido => {
                const nomeMesaExibicao = pedido.saved_table_name || pedido.table_details?.identification || (pedido.table ? `Mesa #${pedido.table}` : 'Atendimento Balcão');

                return (
                  <div
                    key={pedido.id}
                    className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 flex flex-col hover:border-gold-500/50 transition-all shadow-sm relative group"
                  >
                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-3 sm:mb-4 border-b border-dark-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white">{nomeMesaExibicao}</h3>
                          <span title="Pedido finalizado e protegido contra alterações">
                            <Lock size={14} className="text-gray-500 group-hover:text-gold-500 transition-colors" />
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px] sm:max-w-[200px]">
                          {pedido.customer_name ? `Cliente: ${pedido.customer_name}` : 'Cliente não identificado'}
                        </p>
                      </div>

                      {getMetodoBadge(pedido.payment_method)}
                    </div>

                    {/* Itens Consumidos (Dados Congelados) */}
                    <div className="flex-1 mb-4">
                      <p className="text-[10px] sm:text-[11px] text-gray-400 mb-2 font-bold uppercase tracking-wider">
                        Itens Consumidos:
                      </p>
                      <ul className="text-xs sm:text-sm text-gray-300 space-y-1.5 divide-y divide-dark-border/40 max-h-48 overflow-y-auto pr-1">
                        {pedido.items && pedido.items.length > 0 ? (
                          pedido.items.map((item, idx) => {
                            const nomeItemCongelado = item.saved_item_name || item.item_details?.name || 'Item';
                            const precoUnitario = parseFloat(item.unit_price || item.item_details?.price || 0);

                            return (
                              <li key={idx} className="pt-1.5 flex justify-between items-center text-xs">
                                <span className="truncate pr-2">
                                  <strong className="text-gold-500 font-mono">{item.quantity}x</strong> {nomeItemCongelado}
                                </span>
                                <span className="text-gray-400 font-mono shrink-0">
                                  R$ {(item.quantity * precoUnitario).toFixed(2).replace('.', ',')}
                                </span>
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-xs text-gray-500 italic">Sem itens registrados</li>
                        )}
                      </ul>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="mt-auto bg-dark-bg p-3 sm:p-3.5 rounded-xl border border-dark-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">Total Pago:</span>
                        <span className="text-lg sm:text-xl font-bold text-gold-500 font-mono">
                          R$ {parseFloat(pedido.total || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {parseFloat(pedido.change || 0) > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-dark-border/50">
                          <span className="text-gray-500">Troco Devolvido:</span>
                          <span className="font-bold text-gray-300 font-mono">
                            R$ {parseFloat(pedido.change).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}

                      <div className="text-right mt-2 pt-2 border-t border-dark-border/40">
                        <span className="text-[10px] text-gray-500">
                          {pedido.closed_at
                            ? `Finalizado em: ${new Date(pedido.closed_at).toLocaleString('pt-BR')}`
                            : 'Data não registrada'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão Carregar Mais */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => carregarHistorico(false)}
                  disabled={loading}
                  className="bg-dark-card border border-dark-border hover:border-gold-500 text-gold-500 hover:text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  {loading ? 'Carregando mais...' : 'Carregar mais pedidos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center justify-center">
            <ShieldCheck size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium text-sm">
              {loading ? 'Buscando registros blindados...' : 'Nenhum pedido finalizado encontrado.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
