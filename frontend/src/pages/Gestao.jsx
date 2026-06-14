import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Search } from 'lucide-react';
import api from '../services/api';

export default function Gestao() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS: CATEGORIAS ---
  const [categorias, setCategorias] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catFormData, setCatFormData] = useState({ id: null, name: '' });

  // --- ESTADOS: ITENS ---
  const [itens, setItens] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({ id: null, name: '', price: '', category: '', description: '' });
  const [itemImageFile, setItemImageFile] = useState(null);

  // NOVO: Estados para busca e filtragem de produtos na listagem
  const [searchItemTerm, setSearchItemTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [resCat, resItens] = await Promise.all([
        api.get('categorias/'),
        api.get('itens/')
      ]);
      setCategorias(resCat.data);
      setItens(resItens.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // ==========================================
  // FUNÇÕES DE CATEGORIAS (CRUD)
  // ==========================================
  const abrirModalCategoria = (categoria = null) => {
    if (categoria) {
      setCatFormData({ id: categoria.id, name: categoria.name });
    } else {
      setCatFormData({ id: null, name: '' });
    }
    setIsCatModalOpen(true);
  };

  const salvarCategoria = async (e) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return;

    setLoading(true);
    try {
      if (catFormData.id) {
        await api.put(`categorias/${catFormData.id}/`, { name: catFormData.name });
      } else {
        await api.post('categorias/', { name: catFormData.name });
      }
      setIsCatModalOpen(false);
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    } finally {
      setLoading(false);
    }
  };

  const excluirCategoria = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      await api.delete(`categorias/${id}/`);
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Não é possível excluir categorias que possuem itens vinculados.");
    }
  };

  // ==========================================
  // FUNÇÕES DE ITENS (CRUD)
  // ==========================================
  const abrirModalItem = (item = null) => {
    if (item) {
      setItemFormData({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || ''
      });
    } else {
      setItemFormData({ id: null, name: '', price: '', category: '', description: '' });
    }
    setItemImageFile(null);
    setIsItemModalOpen(true);
  };

  const salvarItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', itemFormData.name);
      formData.append('price', itemFormData.price);
      formData.append('category', itemFormData.category);
      if (itemFormData.description) formData.append('description', itemFormData.description);

      if (itemImageFile) {
        formData.append('image', itemImageFile);
      }

      if (itemFormData.id) {
        await api.patch(`itens/${itemFormData.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('itens/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsItemModalOpen(false);
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert("Erro ao salvar o item. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const excluirItem = async (id) => {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    try {
      await api.delete(`itens/${id}/`);
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  // NOVO: Lógica de filtragem dos produtos em tempo real na tela
  const itensFiltrados = itens.filter(item => {
    const termo = searchItemTerm.toLowerCase();
    const matchBusca = item.name.toLowerCase().includes(termo) ||
                       (item.description && item.description.toLowerCase().includes(termo));

    const matchCategoria = selectedCategoryFilter === '' || item.category === parseInt(selectedCategoryFilter);

    return matchBusca && matchCategoria;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col relative">
      <header className="mb-8 border-b border-dark-border pb-4 flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão do Cardápio</h1>
          <p className="text-gray-400 mt-1">Gerencie suas categorias e produtos.</p>
        </div>

        <button
          onClick={() => activeTab === 'categorias' ? abrirModalCategoria() : abrirModalItem()}
          className="bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 px-5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex-shrink-0"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar Novo</span>
        </button>
      </header>

      {/* Navegação por Abas */}
      <div className="flex gap-6 mb-6 border-b border-dark-border">
        <button
          onClick={() => setActiveTab('categorias')}
          className={`pb-3 font-bold text-lg transition-colors relative ${activeTab === 'categorias' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
        >
          Categorias
          {activeTab === 'categorias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('itens')}
          className={`pb-3 font-bold text-lg transition-colors relative ${activeTab === 'itens' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
        >
          Produtos
          {activeTab === 'itens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-t-full" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-20">
        {/* --- ABA: CATEGORIAS --- */}
        {activeTab === 'categorias' && (
          <div className="animate-fade-in max-w-2xl">
            {categorias.length > 0 ? (
              <ul className="divide-y divide-dark-border border border-dark-border rounded-xl bg-dark-card overflow-hidden">
                {categorias.map(cat => (
                  <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-dark-bg transition-colors group">
                    <span className="text-white font-bold text-lg">{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => abrirModalCategoria(cat)} className="p-2 text-gray-400 hover:text-gold-500 bg-dark-bg rounded-lg border border-transparent hover:border-gold-500/30 transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => excluirCategoria(cat.id)} className="p-2 text-gray-400 hover:text-red-500 bg-dark-bg rounded-lg border border-transparent hover:border-red-500/30 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-10">Nenhuma categoria cadastrada.</p>
            )}
          </div>
        )}

        {/* --- ABA: ITENS (PRODUTOS) --- */}
        {activeTab === 'itens' && (
          <div className="animate-fade-in flex flex-col">

            {/* NOVO: PAINEL DE FILTROS E BUSCA INTELIGENTE */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-dark-card p-4 rounded-xl border border-dark-border">
              {/* Input de Texto */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produto por nome ou descrição..."
                  value={searchItemTerm}
                  onChange={(e) => setSearchItemTerm(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              {/* Select de Categoria */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-lg p-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors sm:w-48 cursor-pointer"
              >
                <option value="">Todas as Categorias</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Grid de Exibição dos Itens Filtrados */}
            {itensFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {itensFiltrados.map(item => (
                  <div key={item.id} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden flex flex-col group hover:border-gray-500 transition-colors">

                    <div className="h-40 bg-dark-bg relative border-b border-dark-border flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-600 flex flex-col items-center gap-2">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold uppercase tracking-wider">Sem Foto</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                        <button onClick={() => abrirModalItem(item)} className="p-3 bg-dark-card text-gold-500 hover:text-white border border-gold-500 rounded-full transition-all hover:scale-110 shadow-lg">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => excluirItem(item.id)} className="p-3 bg-dark-card text-red-500 hover:text-white border border-red-500 rounded-full transition-all hover:scale-110 shadow-lg">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-white text-lg leading-tight mb-1">{item.name}</h3>
                      <p className="text-gold-500 font-bold text-xl mb-2">R$ {item.price}</p>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-auto">{item.description || 'Nenhuma descrição fornecida.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center text-gray-500">
                {searchItemTerm || selectedCategoryFilter ? "Nenhum produto corresponde aos filtros aplicados." : "Nenhum produto cadastrado."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================
          MODAL: FORMULÁRIO DE CATEGORIA
      ========================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{catFormData.id ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={salvarCategoria} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Nome da Categoria</label>
                <input
                  type="text"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({...catFormData, name: e.target.value})}
                  placeholder="Ex: Bebidas"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  autoFocus
                  required
                />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 mt-4 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Categoria'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: FORMULÁRIO DE ITEM
      ========================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <h2 className="text-xl font-bold text-white">{itemFormData.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={salvarItem} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Categoria</label>
                <select
                  value={itemFormData.category}
                  onChange={(e) => setItemFormData({...itemFormData, category: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  required
                >
                  <option value="">Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Nome do Produto</label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                  placeholder="Ex: Espetinho Misto"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemFormData.price}
                  onChange={(e) => setItemFormData({...itemFormData, price: e.target.value})}
                  placeholder="Ex: 15.90"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                  placeholder="Ex: Acompanha farofa e vinagrete..."
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors resize-none h-24"
                />
              </div>

              <div className="bg-dark-bg border border-dark-border border-dashed rounded-xl p-4 text-center">
                <label className="block text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">
                  Foto do Produto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setItemImageFile(e.target.files[0])}
                  className="text-gray-400 text-sm w-full file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-dark-card file:text-gold-500 hover:file:bg-gold-500/10 transition-all"
                />
                {itemFormData.id && !itemImageFile && (
                  <p className="text-xs text-gray-500 mt-2">Deixe em branco para manter a foto atual.</p>
                )}
              </div>

              <button disabled={loading} type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 mt-2 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}