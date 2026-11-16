import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  UtensilsCrossed,
  Trash2,
  Receipt,
  PlusCircle,
  CreditCard,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/mesa/ConfirmModal';
import MenuModal from '../components/mesa/MenuModal';
import CheckoutModal from '../components/mesa/CheckoutModal';

export default function Mesa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mesa, setMesa] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados dos Componentes Filhos
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [nomeCliente, setNomeCliente] = useState('');

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const resMesa = await api.get(`mesas/${id}/`);
      setMesa(resMesa.data);

      const resPedidos = await api.get('pedidos/');
      const pedidoAberto = resPedidos.data.find(
        p => p.table === parseInt(id) && p.status === 'aberto'
      );

      if (pedidoAberto && pedidoAberto.items) {
        pedidoAberto.items.sort((a, b) => a.id - b.id);
      }

      setPedido(pedidoAberto || null);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirAtendimento = async () => {
    try {
      const novoPedido = {
        table: parseInt(id),
        status: 'aberto',
        total: "0.00",
        customer_name: nomeCliente
      };
      const res = await api.post('pedidos/', novoPedido);

      await api.patch(`mesas/${id}/`, { status: 'ocupada' });
      setPedido(res.data);
      setMesa({ ...mesa, status: 'ocupada' });
      setNomeCliente('');
      carregarDados();
    } catch (error) {
      console.error("Erro ao abrir atendimento:", error);
    }
  };

  const abrirCardapio = async () => {
    setIsMenuOpen(true);
    if (categorias.length === 0) {
      try {
        const [resCat, resItens] = await Promise.all([
          api.get('categorias/'),
          api.get('itens/')
        ]);
        setCategorias(resCat.data);
        setItens(resItens.data);
      } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
      }
    }
  };

  const handleLancarTudo = async (quantidadesSelecionadas) => {
    try {
      const itensParaLancar = Object.entries(quantidadesSelecionadas).filter(([_, qtd]) => qtd > 0);

      if (itensParaLancar.length === 0) {
        alert("Selecione pelo menos um item para lançar.");
        return;
      }

      const requests = itensParaLancar.map(([itemId, qtd]) => {
        const itemCompleto = itens.find(i => i.id === parseInt(itemId));
        return api.post('itens-pedido/', {
          order: pedido.id,
          item: itemCompleto.id,
          quantity: qtd,
          unit_price: itemCompleto.price
        });
      });

      await Promise.all(requests);
      setIsMenuOpen(false);
      carregarDados();
    } catch (error) {
      console.error("Erro ao lançar itens:", error);
    }
  };

  const confirmarRemocao = async () => {
    if (!itemParaRemover) return;
    try {
      await api.delete(`itens-pedido/${itemParaRemover}/`);
      setItemParaRemover(null);
      carregarDados();
    } catch (error) {
      console.error("Erro ao remover item:", error);
      alert("Ocorreu um erro ao tentar remover o item.");
    }
  };

  // --- FINALIZAR CONTA ---
  const handleFinalizarConta = async (totalCalculado, metodoPagamento, trocoCalculado) => {
    try {
      await api.patch(`pedidos/${pedido.id}/`, {
        status: 'finalizado',
        total: totalCalculado.toFixed(2),
        change: trocoCalculado.toFixed(2),
        payment_method: metodoPagamento,
        closed_at: new Date().toISOString()
      });

      // Libera a mesa mudando o status
      await api.patch(`mesas/${id}/`, {
        status: 'livre'
      });

      // Retorna para o mapa de mesas
      navigate('/');
    } catch (error) {
      console.error("Erro ao finalizar conta:", error);
      alert("Erro ao finalizar a conta. Tente novamente.");
    }
  };

  if (loading) {
    return <div className="text-center text-gold-500 mt-20 font-bold text-lg animate-pulse">Carregando dados da mesa...</div>;
  }

  // Cálculo do total atual do pedido
  const totalAtual = pedido?.items?.reduce((acc, item) => {
    return acc + (item.quantity * parseFloat(item.unit_price || 0));
  }, 0) || 0;

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col flex-1">
      {/* Botão Superior de Retorno */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gold-500 bg-dark-card border border-dark-border hover:border-gold-500/40 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao Mapa de Mesas</span>
        </button>
      </div>

      {/* Cabeçalho da Mesa (100% largura útil) */}
      <header className="mb-6 border-b border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-500 font-black text-xl shadow-sm">
            {mesa?.identification?.replace(/\D/g, '') || '#'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mesa?.identification}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Identificador Operacional do Estabelecimento
            </p>
          </div>
        </div>

        {/* Badge de Status */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs ${
              mesa?.status === 'ocupada'
                ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mesa?.status === 'ocupada' ? 'bg-gold-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            Mesa {mesa?.status?.toUpperCase()}
          </span>
        </div>
      </header>

      {/* --- SE A MESA ESTIVER LIVRE: PREENCHE 100% DA TELA DE FORMA RESPONSIVA (ANEXO 1) --- */}
      {!pedido ? (
        <div className="w-full bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-10 md:p-14 shadow-xl flex flex-col items-center justify-center text-center animate-fade-in my-auto">
          <div className="w-20 h-20 rounded-3xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-500 mb-5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <UtensilsCrossed size={38} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Iniciar Atendimento • {mesa?.identification}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-8 max-w-lg leading-relaxed">
            Esta mesa está livre no momento. Informe o nome do cliente ou comanda para ocupar a mesa e começar a lançar pedidos.
          </p>

          <div className="w-full max-w-lg mx-auto space-y-4">
            <div className="text-left">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nome do Cliente / Comanda (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') abrirAtendimento(); }}
                  placeholder="Ex: João Silva ou Família Oliveira"
                  className="w-full bg-dark-bg border border-dark-border rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors text-sm font-medium"
                />
              </div>
            </div>

            <button
              onClick={abrirAtendimento}
              className="w-full bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 cursor-pointer"
            >
              <Sparkles size={18} />
              <span>Iniciar Atendimento & Ocupar Mesa</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 text-gray-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar e Voltar ao Mapa de Mesas
            </button>
          </div>
        </div>
      ) : isMenuOpen ? (
        /* --- MODO ADICIONAR ITENS: 100% DA LARGURA DENTRO DO PAINEL DE MESAS (ANEXO 3) --- */
        <MenuModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          categorias={categorias}
          itens={itens}
          onLancarTudo={handleLancarTudo}
          mesaIdentificacao={mesa?.identification}
        />
      ) : (
        /* --- SE A MESA ESTIVER OCUPADA: PREENCHE 100% DA TELA DE FORMA RESPONSIVA (ANEXO 2) --- */
        <div className="w-full bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl flex flex-col flex-1 animate-fade-in">
          {/* Barra Superior do Pedido Ativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-dark-border">
            <div>
              <div className="flex items-center gap-2.5">
                <Receipt size={22} className="text-gold-500" />
                <h2 className="text-xl sm:text-2xl font-black text-white">Comanda em Aberto</h2>
                <span className="text-xs font-mono font-bold bg-zinc-800 text-gold-400 px-3 py-1 rounded-full border border-zinc-700">
                  Pedido #{pedido.id}
                </span>
              </div>
              {pedido.customer_name && (
                <p className="text-xs sm:text-sm text-gray-400 mt-1.5 flex items-center gap-1.5">
                  <User size={15} className="text-gray-500" />
                  Cliente: <span className="text-white font-bold">{pedido.customer_name}</span>
                </p>
              )}
            </div>

            {/* Total Parcial em Destaque */}
            <div className="flex items-center gap-3 bg-dark-bg border border-dark-border px-5 py-2.5 rounded-2xl self-start sm:self-auto shadow-inner">
              <span className="text-xs uppercase font-extrabold text-gray-400">Total Parcial:</span>
              <span className="text-2xl sm:text-3xl font-black text-gold-500 font-mono">
                R$ {totalAtual.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Lista de Itens Lançados (Ocupando toda a largura útil) */}
          <div className="flex-1 overflow-y-auto mb-6 min-h-[220px] max-h-[50vh] pr-1">
            {pedido.items && pedido.items.length > 0 ? (
              <ul className="divide-y divide-dark-border/70">
                {pedido.items.map((item, index) => (
                  <li key={index} className="py-3.5 sm:py-4 flex justify-between items-center gap-4 group hover:bg-dark-bg/50 px-3 rounded-2xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-gold-500 text-sm bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20 shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="text-white font-bold text-sm sm:text-base truncate">
                          {item.item_details?.name || item.saved_item_name || 'Item'}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs block mt-1 font-mono pl-1">
                        R$ {parseFloat(item.unit_price).toFixed(2).replace('.', ',')} cada
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-white font-black text-base sm:text-lg font-mono">
                        R$ {(item.quantity * parseFloat(item.unit_price)).toFixed(2).replace('.', ',')}
                      </span>

                      <button
                        onClick={() => setItemParaRemover(item.id)}
                        className="text-gray-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remover item do pedido"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-16 text-gray-500 border-2 border-dashed border-dark-border rounded-3xl">
                <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30 text-gold-500" />
                <p className="font-bold text-base text-gray-300">Nenhum item lançado nesta mesa ainda.</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Clique no botão abaixo para escolher e adicionar produtos do cardápio à comanda.
                </p>
              </div>
            )}
          </div>

          {/* Botões de Ação da Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-dark-border">
            <button
              onClick={abrirCardapio}
              className="flex items-center justify-center gap-2.5 w-full bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] text-sm sm:text-base active:scale-95 cursor-pointer"
            >
              <PlusCircle size={20} />
              <span>+ Adicionar Item do Cardápio</span>
            </button>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm sm:text-base active:scale-95 cursor-pointer"
            >
              <CreditCard size={20} />
              <span>Finalizar Conta & Fechar Mesa</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAIS DE SUPORTE --- */}
      <ConfirmModal
        isOpen={!!itemParaRemover}
        onClose={() => setItemParaRemover(null)}
        onConfirm={confirmarRemocao}
        title="Remover Item"
        message="Deseja realmente excluir este item do pedido?"
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        pedido={pedido}
        onConfirm={handleFinalizarConta}
      />
    </div>
  );
}
