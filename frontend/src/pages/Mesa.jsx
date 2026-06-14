import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from '../components/mesa/ConfirmModal';
import MenuModal from '../components/mesa/MenuModal';
import CheckoutModal from '../components/mesa/CheckoutModal'; // <- NOVO IMPORT

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

  // ---  FINALIZAR CONTA ---
  const handleFinalizarConta = async (totalCalculado, metodoPagamento, trocoCalculado) => {
    try {
      await api.patch(`pedidos/${pedido.id}/`, {
        status: 'finalizado',
        total: totalCalculado.toFixed(2),
        change: trocoCalculado.toFixed(2),
        closed_at: new Date().toISOString()
      });

      // 2. Liberta a mesa mudando o status
      await api.patch(`mesas/${id}/`, {
        status: 'livre'
      });

      // 3. Retorna a recepcionista para o mapa de mesas
      navigate('/');
    } catch (error) {
      console.error("Erro ao finalizar conta:", error);
      alert("Erro ao finalizar a conta. Tente novamente.");
    }
  };

  if (loading) return <div className="text-center text-gold-500 mt-20 font-bold">Carregando...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col relative">
      <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gold-500 mb-6 flex items-center gap-2 self-start transition-colors">
        <span>←</span> Voltar para o mapa
      </button>

      <header className="mb-8 border-b border-dark-border pb-4">
        <h1 className="text-3xl font-bold text-white">{mesa?.identification}</h1>
        <p className="text-gray-400 mt-1">
          Status: <span className={mesa?.status === 'ocupada' ? 'text-gold-500 font-bold' : 'text-green-500 font-bold'}>
            {mesa?.status.toUpperCase()}
          </span>
        </p>
      </header>

      {!pedido ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 flex flex-col items-center justify-center flex-1">
          <p className="text-gray-400 mb-6">Esta mesa está livre no momento.</p>
          <div className="w-full max-w-xs mb-6">
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">
              Nome do Cliente (Opcional)
            </label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <button onClick={abrirAtendimento} className="bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 px-8 rounded-xl w-full max-w-xs transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Abrir Atendimento
          </button>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 md:p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl text-gold-400 font-bold">Consumo Atual</h2>
              {pedido.customer_name && (
                <p className="text-sm text-gray-400 mt-1">Cliente: <span className="text-white font-semibold">{pedido.customer_name}</span></p>
              )}
            </div>
            <span className="text-sm text-gray-500">Pedido #{pedido.id}</span>
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            {pedido.items && pedido.items.length > 0 ? (
              <ul className="divide-y divide-dark-border">
                {pedido.items.map((item, index) => (
                  <li key={index} className="py-4 flex justify-between items-center gap-2">
                    <div className="flex-1">
                      <span className="text-white font-bold block">{item.quantity}x {item.item_details?.name}</span>
                      <span className="text-gray-500 text-sm block">Unidade: R$ {item.unit_price}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gold-500 font-bold text-lg whitespace-nowrap">
                        R$ {(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                      </span>

                      <button
                        onClick={() => setItemParaRemover(item.id)}
                        className="text-gray-600 hover:text-red-500 p-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Remover item"
                      >
                        <span className="text-xl font-bold leading-none">✕</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-10">Nenhum item lançado ainda.</div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-dark-border">
            <button
              onClick={abrirCardapio}
              className="w-full bg-dark-bg border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold py-4 px-4 rounded-xl transition-all"
            >
              + Adicionar Item
            </button>
            {/* NOVO: Ação do botão Finalizar Conta */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-red-900/20 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white font-bold py-4 px-4 rounded-xl transition-all"
            >
              Finalizar Conta
            </button>
          </div>
        </div>
      )}

      {/* COMPONENTES EXTRAÍDOS AQUI */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categorias={categorias}
        itens={itens}
        onLancarTudo={handleLancarTudo}
      />

      <ConfirmModal
        isOpen={!!itemParaRemover}
        onClose={() => setItemParaRemover(null)}
        onConfirm={confirmarRemocao}
        title="Remover Item"
        message="Deseja realmente excluir este item do pedido?"
      />

      {/* NOVO MODAL DE CHECKOUT */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        pedido={pedido}
        onConfirm={handleFinalizarConta}
      />
    </div>
  );
}