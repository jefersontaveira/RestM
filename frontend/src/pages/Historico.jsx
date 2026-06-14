import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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

  // Efeito de Busca com Debounce (Aguarda o usuário parar de digitar por 500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarHistorico(true); // Executa resetando a paginação
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const carregarHistorico = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      // Faz a chamada buscando diretamente no Banco de Dados com os filtros aplicados
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

      // Se o banco trouxe menos de 20 itens, significa que os registros acabaram
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

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/')}
        className="text-gray-400 hover:text-gold-500 mb-6 flex items-center gap-2 self-start transition-colors"
      >
        <span>←</span> Voltar para o mapa
      </button>

      {/* Cabeçalho Limpo (Sem o Faturamento Total) */}
      <header className="mb-6 border-b border-dark-border pb-4">
        <h1 className="text-3xl font-bold text-white">Histórico de Pedidos</h1>
        <p className="text-gray-400 mt-1">Busque pedidos arquivados diretamente no banco de dados.</p>
      </header>

      {/* Barra de Pesquisa Integrada ao Banco de Dados */}
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar por nome do cliente ou número da mesa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500 transition-colors shadow-sm"
        />
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-6">
        {pedidos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {pedidos.map(pedido => (
                <div key={pedido.id} className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col hover:border-gray-500 transition-colors">
                  <div className="flex justify-between items-start mb-4 border-b border-dark-border pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">Mesa {pedido.table}</h3>
                      <p className="text-sm text-gray-400">
                        {pedido.customer_name ? `Cliente: ${pedido.customer_name}` : 'Sem nome'}
                      </p>
                    </div>
                    <span className="bg-green-900/20 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-green-500/20">
                      Pago
                    </span>
                  </div>

                  <div className="flex-1 mb-4">
                    <p className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Itens Consumidos:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {pedido.items?.map((item, idx) => (
                        <li key={idx}>• {item.quantity}x {item.item_details?.name}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto bg-dark-bg p-3 rounded-lg border border-dark-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-400">Total Pago:</span>
                      <span className="text-lg font-bold text-gold-500">R$ {parseFloat(pedido.total).toFixed(2)}</span>
                    </div>
                    {parseFloat(pedido.change) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Troco Devolvido:</span>
                        <span className="text-xs font-bold text-gray-400">R$ {parseFloat(pedido.change).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="text-right mt-2">
                      <span className="text-[10px] text-gray-600">
                        Fechado em: {new Date(pedido.closed_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTÃO CARREGAR MAIS (Exibe mais 20 se houver registros) */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => carregarHistorico(false)}
                  disabled={loading}
                  className="bg-dark-card border border-dark-border hover:border-gold-500 text-gold-500 hover:text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : 'Carregar mais 20 pedidos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-gray-400">
              {loading ? 'Buscando no banco...' : 'Nenhum pedido finalizado encontrado.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}