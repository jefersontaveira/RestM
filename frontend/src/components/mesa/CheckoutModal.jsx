import { useState, useEffect } from 'react';

export default function CheckoutModal({ isOpen, onClose, pedido, onConfirm }) {
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');

  // Novo estado para controlar o pop-up da calculadora
  const [showTrocoModal, setShowTrocoModal] = useState(false);

  // Reseta os estados sempre que o modal principal é aberto ou fechado
  useEffect(() => {
    if (isOpen) {
      setMetodoPagamento('');
      setValorRecebido('');
      setShowTrocoModal(false);
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  // Calcula o total do pedido varrendo os itens
  const total = pedido.items?.reduce((acc, item) => {
    return acc + (item.quantity * parseFloat(item.unit_price));
  }, 0) || 0;

  // Calcula o troco automaticamente
  const valorRecebidoNum = parseFloat(valorRecebido.replace(',', '.')) || 0;
  const troco = valorRecebidoNum - total;

  const handleConfirmar = () => {
    if (!metodoPagamento) {
      alert("Por favor, selecione um método de pagamento.");
      return;
    }

    if (metodoPagamento === 'dinheiro') {
      if (!valorRecebido || valorRecebidoNum < total) {
        alert("O valor recebido é inválido ou menor que o total da conta.");
        return;
      }
    }

    const trocoFinal = metodoPagamento === 'dinheiro' ? troco : 0;
    onConfirm(total, metodoPagamento, trocoFinal);
  };

  const cancelarTroco = () => {
    setShowTrocoModal(false);
    setMetodoPagamento(''); // Desmarca o botão de dinheiro se o usuário cancelar
    setValorRecebido('');
  };

  const metodos = [
    { id: 'dinheiro', label: 'Dinheiro' },
    { id: 'pix', label: 'PIX' },
    { id: 'credito', label: 'Cartão de Crédito' },
    { id: 'debito', label: 'Cartão de Débito' }
  ];

  return (
    <>
      {/* --- MODAL PRINCIPAL DE CHECKOUT --- */}
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 md:p-8 animate-fade-in items-center justify-center">
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

          <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gold-500">Finalizar Conta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl font-bold p-2 leading-none">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-thin">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Resumo do Consumo</h3>
            <ul className="divide-y divide-dark-border">
              {pedido.items?.map((item, index) => (
                <li key={index} className="py-2 flex justify-between text-sm">
                  <span className="text-white">{item.quantity}x {item.item_details?.name}</span>
                  <span className="text-gray-400">R$ {(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-dark-bg p-4 rounded-xl border border-gold-500/30 mb-6 flex justify-between items-center flex-shrink-0">
            <span className="text-gray-400 font-bold uppercase">Total a Pagar</span>
            <span className="text-3xl font-bold text-gold-500">R$ {total.toFixed(2)}</span>
          </div>

          <div className="mb-6 flex-shrink-0">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Método de Pagamento</h3>
            <div className="grid grid-cols-2 gap-3">
              {metodos.map(metodo => (
                <button
                  key={metodo.id}
                  onClick={() => {
                    setMetodoPagamento(metodo.id);
                    if (metodo.id === 'dinheiro') {
                      setShowTrocoModal(true); // Abre o pop-up secundário
                    }
                  }}
                  className={`py-3 px-2 rounded-lg font-bold text-sm transition-colors border ${
                    metodoPagamento === metodo.id
                      ? 'bg-gold-500 border-gold-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {metodo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Confirmação para os outros métodos */}
          <button
            onClick={handleConfirmar}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg text-lg mt-auto flex-shrink-0"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>

      {/* --- SUB-MODAL: CALCULADORA DE TROCO --- */}
      {showTrocoModal && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4 animate-fade-in items-center justify-center">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-xs shadow-2xl flex flex-col">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gold-500">Pagamento em Dinheiro</h2>
              <button onClick={cancelarTroco} className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">✕</button>
            </div>

            <div className="mb-6 text-center bg-dark-bg p-3 rounded-lg border border-dark-border">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total a Pagar</p>
              <p className="text-2xl font-bold text-white">R$ {total.toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">
                Valor Recebido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Ex: 100.00"
                autoFocus
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-4 text-white text-2xl font-bold mb-4 focus:outline-none focus:border-gold-500 transition-colors text-center"
              />

              {/* Lógica do Troco */}
              {valorRecebidoNum >= total ? (
                <div className="flex flex-col items-center bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                  <span className="text-green-500 font-bold uppercase tracking-wider text-xs mb-1">Troco a devolver</span>
                  <span className="text-green-400 font-bold text-3xl">R$ {troco.toFixed(2)}</span>
                </div>
              ) : valorRecebidoNum > 0 ? (
                <div className="text-red-500 text-sm font-bold text-center bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                  Faltam R$ {Math.abs(troco).toFixed(2)} para fechar a conta.
                </div>
              ) : null}
            </div>

            {/* Botões de Ação do Sub-Modal */}
            <div className="flex gap-3">
              <button
                onClick={cancelarTroco}
                className="flex-1 bg-dark-bg border border-dark-border text-gray-400 hover:text-white py-3 rounded-xl font-bold transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmar}
                className="flex-[2] bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                Finalizar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}