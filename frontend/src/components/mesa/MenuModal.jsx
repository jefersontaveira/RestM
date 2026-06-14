import { useState, useEffect } from 'react';

export default function MenuModal({ isOpen, onClose, categorias, itens, onLancarTudo }) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [quantidades, setQuantidades] = useState({});

  // Reseta o modal sempre que for aberto
  useEffect(() => {
    if (isOpen) {
      setQuantidades({});
      if (categorias.length > 0) {
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
    // Devolve apenas as quantidades para a página principal fazer a chamada na API
    onLancarTudo(quantidades);
  };

  const totalItensSelecionados = Object.values(quantidades).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg flex flex-col p-4 md:p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Adicionar Produto</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl font-bold p-2">✕</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaSelecionada(cat.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-full font-bold transition-colors ${
              categoriaSelecionada === cat.id ? 'bg-gold-500 text-black' : 'bg-dark-card border border-dark-border text-gray-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itens
            .filter(item => item.category === categoriaSelecionada)
            .map(item => {
              const qtd = quantidades[item.id] || 0;
              return (
                <div key={item.id} className="bg-dark-card border border-dark-border p-3 rounded-xl flex gap-4">
                  {item.image ? (
                    <img
                      src={item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg bg-dark-bg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-dark-bg rounded-lg flex items-center justify-center border border-dark-border text-gray-600 text-xs text-center p-2">Sem foto</div>
                  )}

                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight">{item.name}</h3>
                      <p className="text-gold-500 font-bold mt-1">R$ {item.price}</p>
                    </div>

                    <div className="flex items-center justify-center mt-2 bg-dark-bg border border-dark-border rounded-lg overflow-hidden w-full">
                      <button onClick={() => alterarQuantidade(item.id, -1)} className="flex-1 py-2 text-gold-500 font-bold text-xl hover:bg-dark-border transition-colors">-</button>
                      <span className="px-6 text-white font-bold text-lg">{qtd}</span>
                      <button onClick={() => alterarQuantidade(item.id, 1)} className="flex-1 py-2 text-gold-500 font-bold text-xl hover:bg-dark-border transition-colors">+</button>
                    </div>
                  </div>
                </div>
            )})}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-dark-bg border-t border-dark-border">
        <button
          onClick={handleConfirmar}
          className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 px-4 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex justify-center items-center gap-2"
        >
          Lançar Itens Selecionados
          {totalItensSelecionados > 0 && (
            <span className="bg-black text-gold-500 px-3 py-1 rounded-full text-sm">
              {totalItensSelecionados}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}