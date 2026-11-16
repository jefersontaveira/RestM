import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, QrCode, Coins, Check, AlertCircle } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, pedido, onConfirm }) {
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [showTrocoModal, setShowTrocoModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMetodoPagamento('');
      setValorRecebido('');
      setShowTrocoModal(false);
    }
  }, [isOpen]);

  if (!isOpen || !pedido) return null;

  const total = pedido.items?.reduce((acc, item) => {
    return acc + (item.quantity * parseFloat(item.unit_price || 0));
  }, 0) || 0;

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
    setMetodoPagamento('');
    setValorRecebido('');
  };

  const metodos = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={16} /> },
    { id: 'pix', label: 'PIX', icon: <QrCode size={16} /> },
    { id: 'credito', label: 'Crédito', icon: <CreditCard size={16} /> },
    { id: 'debito', label: 'Débito', icon: <CreditCard size={16} /> }
  ];

  return (
    <>
      {/* --- MODAL PRINCIPAL DE CHECKOUT --- */}
      <div className="fixed inset-0 z-50 bg-black/85 flex flex-col p-4 animate-fade-in items-center justify-center backdrop-blur-sm overflow-y-auto">
        <div className="bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl flex flex-col max-h-[92vh] my-auto">

          <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-dark-border pb-3 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-black text-white">Finalizar Conta</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-dark-bg transition-colors"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Resumo do Consumo */}
          <div className="flex-1 overflow-y-auto mb-4 pr-1 scrollbar-none max-h-48">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Resumo do Consumo</h3>
            <ul className="divide-y divide-dark-border/60 text-xs sm:text-sm">
              {pedido.items?.map((item, index) => (
                <li key={index} className="py-2 flex justify-between items-center">
                  <span className="text-white truncate pr-2">
                    <strong className="text-gold-500 font-mono">{item.quantity}x</strong> {item.item_details?.name || item.saved_item_name || 'Item'}
                  </span>
                  <span className="text-gray-400 font-mono shrink-0">
                    R$ {(item.quantity * parseFloat(item.unit_price || 0)).toFixed(2).replace('.', ',')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total */}
          <div className="bg-dark-bg p-3.5 sm:p-4 rounded-2xl border border-gold-500/30 mb-4 flex justify-between items-center flex-shrink-0">
            <span className="text-gray-400 font-bold uppercase text-xs sm:text-sm tracking-wider">Total a Pagar</span>
            <span className="text-2xl sm:text-3xl font-black text-gold-500 font-mono">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Métodos de Pagamento */}
          <div className="mb-5 flex-shrink-0">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              Método de Pagamento
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {metodos.map(metodo => (
                <button
                  key={metodo.id}
                  type="button"
                  onClick={() => {
                    setMetodoPagamento(metodo.id);
                    if (metodo.id === 'dinheiro') {
                      setShowTrocoModal(true);
                    }
                  }}
                  className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                    metodoPagamento === metodo.id
                      ? 'bg-gold-500 border-gold-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-dark-bg border-dark-border text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {metodo.icon}
                  <span>{metodo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Confirmação */}
          <button
            onClick={handleConfirmar}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 sm:py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] text-sm sm:text-base mt-auto flex-shrink-0 active:scale-95 cursor-pointer"
          >
            Confirmar Pagamento & Liberar Mesa
          </button>
        </div>
      </div>

      {/* --- SUB-MODAL: CALCULADORA DE TROCO --- */}
      {showTrocoModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col p-4 animate-fade-in items-center justify-center backdrop-blur-md">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-6 w-full max-w-xs shadow-2xl flex flex-col">

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dark-border">
              <h2 className="text-lg font-bold text-gold-500 flex items-center gap-2">
                <Banknote size={18} />
                <span>Em Dinheiro</span>
              </h2>
              <button
                onClick={cancelarTroco}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 text-center bg-dark-bg p-3 rounded-xl border border-dark-border">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Total a Pagar</p>
              <p className="text-2xl font-black text-white font-mono">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">
                Valor Recebido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Ex: 50.00"
                autoFocus
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white text-2xl font-bold mb-3 focus:outline-none focus:border-gold-500 transition-colors text-center font-mono"
              />

              {valorRecebidoNum >= total ? (
                <div className="flex flex-col items-center bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-0.5">Troco a devolver</span>
                  <span className="text-emerald-400 font-black text-2xl font-mono">
                    R$ {troco.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ) : valorRecebidoNum > 0 ? (
                <div className="text-red-400 text-xs font-bold text-center bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
                  Faltam R$ {Math.abs(troco).toFixed(2).replace('.', ',')} para fechar a conta.
                </div>
              ) : null}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={cancelarTroco}
                className="flex-1 bg-dark-bg border border-dark-border text-gray-400 hover:text-white py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmar}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
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
