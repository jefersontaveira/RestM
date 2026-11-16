import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, QrCode, Check, AlertCircle } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, pedido, onConfirm }) {
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');

  // Reseta os campos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setMetodoPagamento('');
      setValorRecebido('');
    }
  }, [isOpen]);

  // Permite fechar pressionando ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        alert("O valor recebido é menor que o total da conta.");
        return;
      }
    }

    const trocoFinal = metodoPagamento === 'dinheiro' ? Math.max(0, troco) : 0;
    onConfirm(total, metodoPagamento, trocoFinal);
  };

  const metodos = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={16} /> },
    { id: 'pix', label: 'PIX', icon: <QrCode size={16} /> },
    { id: 'credito', label: 'Crédito', icon: <CreditCard size={16} /> },
    { id: 'debito', label: 'Débito', icon: <CreditCard size={16} /> }
  ];

  return (
    /* --- POP-UP MODAL FLUTUANTE COM BACKDROP SUAVE --- */
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.15)] flex flex-col max-h-[92vh] my-auto animate-scale-up">

        {/* Cabeçalho do Pop-up */}
        <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-500 shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Finalizar Conta</h2>
              <p className="text-[11px] text-gray-400">
                Pedido #{pedido.id} {pedido.customer_name ? `• ${pedido.customer_name}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-dark-bg transition-colors cursor-pointer"
            title="Fechar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo Rápido dos Itens */}
        <div className="overflow-y-auto mb-3 pr-1 scrollbar-thin max-h-36">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
            Resumo do Consumo ({pedido.items?.length || 0} itens)
          </span>
          <ul className="divide-y divide-dark-border/60 text-xs">
            {pedido.items?.map((item, index) => (
              <li key={index} className="py-1.5 flex justify-between items-center">
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

        {/* Banner com Total da Conta */}
        <div className="bg-dark-bg p-3.5 rounded-2xl border border-gold-500/30 mb-4 flex justify-between items-center shrink-0 shadow-inner">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total a Pagar</span>
          <span className="text-2xl sm:text-3xl font-black text-gold-500 font-mono">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Seletor de Métodos de Pagamento */}
        <div className="mb-4 shrink-0">
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {metodos.map(metodo => (
              <button
                key={metodo.id}
                type="button"
                onClick={() => setMetodoPagamento(metodo.id)}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
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

        {/* --- CALCULADORA DE TROCO INLINE (APARECE QUANDO DINHEIRO FOR SELECIONADO) --- */}
        {metodoPagamento === 'dinheiro' && (
          <div className="p-3 bg-dark-bg border border-gold-500/40 rounded-2xl mb-4 space-y-2.5 animate-fade-in shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gold-500 flex items-center gap-1.5">
                <Banknote size={15} />
                <span>Valor Recebido em Dinheiro</span>
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder={total.toFixed(2)}
                autoFocus
                className="w-full bg-dark-card border border-dark-border rounded-xl py-2 pl-9 pr-3 text-white text-lg font-black font-mono focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            {valorRecebidoNum >= total ? (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Troco a devolver:</span>
                <span className="text-emerald-400 font-black text-lg font-mono">
                  R$ {troco.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : valorRecebidoNum > 0 ? (
              <div className="text-amber-400 text-xs font-bold text-center bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                Faltam R$ {Math.abs(troco).toFixed(2).replace('.', ',')} para fechar a conta.
              </div>
            ) : null}
          </div>
        )}

        {/* Botões de Ação do Pop-up */}
        <div className="flex gap-2.5 pt-3 border-t border-dark-border mt-auto shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-dark-bg border border-dark-border hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!metodoPagamento || (metodoPagamento === 'dinheiro' && (!valorRecebido || valorRecebidoNum < total))}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Check size={16} />
            <span>Confirmar & Fechar Mesa</span>
          </button>
        </div>

      </div>
    </div>
  );
}
