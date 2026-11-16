import { useState, useEffect } from 'react';
import { Plus, Minus, UtensilsCrossed, ArrowLeft, Search, Check } from 'lucide-react';

export default function MenuModal({ isOpen, onClose, categorias, itens, onLancarTudo, mesaIdentificacao }) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [quantidades, setQuantidades] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Reseta o estado sempre que for aberto
  useEffect(() => {
    if (isOpen) {
      setQuantidades({});
      setSearchTerm('');
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

  // Filtragem dos itens por categoria ou por termo de busca
  const itensExibidos = (itens || []).filter(item => {
    if (searchTerm.trim()) {
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return item.category === categoriaSelecionada;
  });

  return (
    <div className="w-full bg-dark-card border border-dark-border rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl flex flex-col flex-1 animate-fade-in">
      {/* Cabeçalho do Cardápio com Botão Voltar para a Comanda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gold-500/10 border border-gold-500/20 rounded-2xl text-gold-500 shadow-sm shrink-0">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Lançar Itens {mesaIdentificacao ? `• ${mesaIdentificacao}` : ''}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Selecione as quantidades dos produtos para adicionar à comanda
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-bg border border-dark-border hover:border-gold-500/40 text-gray-300 hover:text-white font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
          title="Voltar para a comanda"
        >
          <ArrowLeft size={14} />
          <span>Voltar para a Comanda</span>
        </button>
      </div>

      {/* Barra de Pesquisa Rápida */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Buscar produto por nome (ex: Coca, Picanha, Cerveja)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {/* Carrossel de Categorias (visível se não houver busca ativa) */}
      {!searchTerm && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-5 scrollbar-none shrink-0">
          {(categorias || []).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoriaSelecionada(cat.id)}
              className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                categoriaSelecionada === cat.id
                  ? 'bg-gold-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-dark-bg border border-dark-border text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid de Itens do Cardápio com Stepper Touch (100% Responsivo e Preenche a Tela) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-6 max-h-[58vh] overflow-y-auto pr-1">
        {itensExibidos.length > 0 ? (
          itensExibidos.map(item => {
            const qtd = quantidades[item.id] || 0;
            const imageUrl = item.image
              ? (item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`)
              : null;

            return (
              <div
                key={item.id}
                className={`bg-dark-bg border rounded-2xl p-3 sm:p-3.5 flex gap-3 sm:gap-3.5 shadow-sm transition-all ${
                  qtd > 0
                    ? 'border-gold-500 ring-1 ring-gold-500/30 bg-gold-500/5'
                    : 'border-dark-border hover:border-zinc-700'
                }`}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl bg-zinc-900 shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 bg-zinc-900 rounded-xl flex items-center justify-center border border-dark-border text-gray-600 text-[10px] text-center p-1.5 shrink-0">
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

                  {/* Stepper de Quantidade Touch */}
                  <div className="flex items-center justify-between mt-2 bg-dark-card border border-dark-border rounded-xl overflow-hidden w-full max-w-[140px]">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, -1)}
                      className="p-1.5 sm:p-2 text-gold-500 font-black text-sm hover:bg-dark-border/80 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Diminuir quantidade"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2.5 text-white font-black text-sm font-mono">
                      {qtd}
                    </span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, 1)}
                      className="p-1.5 sm:p-2 text-gold-500 font-black text-sm hover:bg-dark-border/80 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Aumentar quantidade"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-dark-border rounded-2xl">
            <p className="font-semibold text-sm">
              {searchTerm ? 'Nenhum produto encontrado para esta busca.' : 'Nenhum produto cadastrado nesta categoria.'}
            </p>
          </div>
        )}
      </div>

      {/* Barra de Ação no Rodapé do Card */}
      <div className="pt-4 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-gray-400">
          {totalItensSelecionados > 0 ? (
            <span>
              <strong className="text-gold-500 font-mono text-sm">{totalItensSelecionados}</strong> {totalItensSelecionados === 1 ? 'item pronto para lançar' : 'itens prontos para lançar'}
            </span>
          ) : (
            <span>Toque no botão <strong>+</strong> nos produtos acima para selecionar</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-dark-bg border border-dark-border hover:border-gray-500 text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={totalItensSelecionados === 0}
            className="flex-[2] sm:flex-none px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-black font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Check size={16} />
            <span>Lançar {totalItensSelecionados > 0 ? `(${totalItensSelecionados}) ` : ''}na Mesa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
