import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl relative transform transition-all scale-100">
        {/* Botão fechar (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Ícone de Alerta com Glow Vermelho */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <Trash2 size={28} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {title || 'Confirmar Exclusão'}
        </h3>

        {itemName && (
          <div className="bg-dark-bg border border-dark-border rounded-xl py-2 px-3 mb-3 text-gold-500 font-bold text-sm truncate">
            {itemName}
          </div>
        )}

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {message || 'Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita.'}
        </p>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-dark-bg border border-dark-border text-gray-300 hover:text-white py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] transform active:scale-95"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

