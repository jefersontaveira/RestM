export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-xs text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-3xl font-bold">!</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-dark-bg border border-dark-border text-gray-400 hover:text-white py-3 rounded-xl font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}