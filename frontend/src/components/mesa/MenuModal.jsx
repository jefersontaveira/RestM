import { useState, useEffect } from 'react';
import { X, Plus, Minus, UtensilsCrossed } from 'lucide-react';

export default function MenuModal({ isOpen, onClose, categorias, itens, onLancarTudo }) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [quantidades, setQuantidades] = useState({});

  // Reseta o modal sempre que for aberto
  useEffect(() => {
    if (isOpen) {
      setQuantidades({});
      if (categorias && categorias.length > 0) {
        setCategoriaSelecionada(categorias[0].id);
      }
    }
  }, [isOpen, categorias]);

  if (!isOpen) return null;

  const alterarQuantidade = (itemId, delta) => {
    setQuantidades(prev => {
      const quantidadeAtual = prev[itemId] || 0;
      const novaQuantidade = Math.max(0, quantidadeAtual + delta);
      return { ...prev, [itemId]: novaQuantidade };
    });
  };

  const handleConfirmar = () => {
    onLancarTudo(quantidades);
  };

  const totalItensSelecionados = Object.values(quantidades).reduce((a, b) => a + b, 0);

  const itensDaCategoria = (itens || []).filter(
    item => item.category === categoriaSelecionada
  );

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg flex flex-col p-3 sm:p-5 md:p-8 animate-fade-in">
      {/* Cabeçalho do Modal */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-dark-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gold-500/10 rounded-xl text-gold-500">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Lançar Itens na Mesa
            </h2>
            <p className="text-xs text-gray-400">
              Escolha os produtos e quantidades desejadas
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-dark-card transition-colors"
          title="Fechar"
        >
          <X size={24} />
        </button>
      </div>

      {/* Chips de Categorias Responsivos (Scroll Horizontal) */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-4 scrollbar-none shrink-0">
        {(categorias || []).map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaSelecionada(cat.id)}
            className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm ${
              categoriaSelecionada === cat.id
                ? 'bg-gold-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de Itens */}
      <div className="flex-1 overflow-y-auto pb-28 pr-1">
        {itensDaCategoria.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {itensDaCategoria.map(item => {
              const qtd = quantidades[item.id] || 0;
              const imageUrl = item.image
                ? (item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`)
                : null;

              return (
                <div
                  key={item.id}
                  className="bg-dark-card border border-dark-border p-3 sm:p-3.5 rounded-2xl flex gap-3 sm:gap-4 shadow-sm hover:border-gold-500/40 transition-all"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-dark-bg shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-dark-bg rounded-xl flex items-center justify-center border border-dark-border text-gray-600 text-[11px] text-center p-2 shrink-0">
                      Sem foto
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <h3 className="text-white font-bold text-sm sm:text-base leading-tight truncate">
                        {item.name}
                      </h3>
                      <p className="text-gold-500 font-extrabold text-sm sm:text-base font-mono mt-0.5">
                        R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* Stepper de Quantidade Touch-Friendly */}
                    <div className="flex items-center justify-between mt-2 bg-dark-bg border border-dark-border rounded-xl overflow-hidden w-full max-w-[160px]">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="p-2 text-gold-500 font-black text-base hover:bg-dark-border/80 transition-colors active:scale-95 flex items-center justify-center"
                        title="Diminuir"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 text-white font-black text-sm sm:text-base font-mono">
                        {qtd}
                      </span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="p-2 text-gold-500 font-black text-base hover:bg-dark-border/80 transition-colors active:scale-95 flex items-center justify-center"
                        title="Aumentar"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 border border-dashed border-dark-border rounded-2xl">
            <p className="font-semibold text-sm">Nenhum produto cadastrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Barra de Ação Fixa no Rodapé do Modal */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-dark-card/95 backdrop-blur-md border-t border-dark-border">
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={totalItensSelecionados === 0}
            className="w-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-black font-extrabold py-3.5 sm:py-4 px-4 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex justify-center items-center gap-2 text-sm sm:text-base active:scale-95 cursor-pointer"
          >
            <span>Lançar Itens Selecionados</span>
            {totalItensSelecionados > 0 && (
              <span className="bg-black text-gold-500 px-3 py-0.5 rounded-full text-xs font-mono font-bold">
                {totalItensSelecionados}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
