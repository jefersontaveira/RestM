import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Search } from 'lucide-react';
import api from '../services/api';
import DeleteModal from '../components/common/DeleteModal';

export default function Gestao() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [loading, setLoading] = useState(false);

  // --- ESTADO DO MODAL CUSTOMIZADO DE EXCLUSÃO ---
  const [deleteTarget, setDeleteTarget] = useState({
    isOpen: false,
    type: null, // 'categoria', 'item', 'mesa'
    id: null,
    name: ''
  });

  // --- ESTADOS: CATEGORIAS ---
  const [categorias, setCategorias] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catFormData, setCatFormData] = useState({ id: null, name: '' });

  // --- ESTADOS: ITENS ---
  const [itens, setItens] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({ id: null, name: '', price: '', category: '', description: '', is_available: true });
  const [itemImageFile, setItemImageFile] = useState(null);

  // Estados para busca e filtragem de produtos na listagem
  const [searchItemTerm, setSearchItemTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // --- ESTADOS: MESAS ---
  const [mesas, setMesas] = useState([]);
  const [isMesaModalOpen, setIsMesaModalOpen] = useState(false);
  const [mesaFormData, setMesaFormData] = useState({ id: null, identification: '' });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [resCat, resItens, resMesas] = await Promise.all([
        api.get('categorias/'),
        api.get('itens/'),
        api.get('mesas/')
      ]);
      setCategorias(resCat.data);
      setItens(resItens.data);
      setMesas(resMesas.data);
      console.log("DADOS REAIS DAS MESAS ENVIADOS PELO DJANGO:", resMesas.data);
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

  const solicitarExclusaoCategoria = (categoria) => {
    setDeleteTarget({
      isOpen: true,
      type: 'categoria',
      id: categoria.id,
      name: categoria.name
    });
  };

  const solicitarExclusaoItem = (item) => {
    setDeleteTarget({
      isOpen: true,
      type: 'item',
      id: item.id,
      name: item.name
    });
  };

  const solicitarExclusaoMesa = (mesa) => {
    if (mesa.status === 'Ocupada' || mesa.status === 'ocupada') {
      alert("Não é possível excluir uma mesa que está ocupada no momento.");
      return;
    }
    setDeleteTarget({
      isOpen: true,
      type: 'mesa',
      id: mesa.id,
      name: mesa.identification
    });
  };

  const executarExclusaoConfirmada = async () => {
    const { type, id } = deleteTarget;
    if (!id) return;

    setDeleteTarget(prev => ({ ...prev, isOpen: false }));
    setLoading(true);
    try {
      if (type === 'categoria') {
        await api.delete(`categorias/${id}/`);
      } else if (type === 'item') {
        await api.delete(`itens/${id}/`);
      } else if (type === 'mesa') {
        await api.delete(`mesas/${id}/`);
      }
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      const detail = error.response?.data?.detail || "Não foi possível concluir a exclusão. Verifique dependências ou permissões.";
      alert(detail);
    } finally {
      setLoading(false);
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
        description: item.description || '',
        is_available: item.is_available !== false
      });
    } else {
      setItemFormData({ id: null, name: '', price: '', category: '', description: '', is_available: true });
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
      formData.append('is_available', itemFormData.is_available);
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



  // ==========================================
  // FUNÇÕES DE MESAS (CRUD)
  // ==========================================
  const abrirModalMesa = (mesa = null) => {
      if (mesa) {
        setMesaFormData({ id: mesa.id, identification: mesa.identification });
      } else {
        setMesaFormData({ id: null, identification: '' });
      }
      setIsMesaModalOpen(true);
    };

     const salvarMesa = async (e) => {
      e.preventDefault();
      if (!mesaFormData.identification.trim()) return;

      setLoading(true);
      try {
        if (mesaFormData.id) {
          await api.patch(`mesas/${mesaFormData.id}/`, { identification: mesaFormData.identification });
        } else {
            await api.post('mesas/', { identification: mesaFormData.identification, status: 'livre' });        }
        setIsMesaModalOpen(false);
        carregarDados();
      } catch (error) {
        console.error("Erro detalhado ao salvar mesa:", error);

        const mensagemErro = error.response?.data
          ? JSON.stringify(error.response.data)
          : "Erro de conexão com o servidor.";

        alert(`Erro ao salvar a mesa!\nResposta do Servidor: ${mensagemErro}`);
      } finally {
        setLoading(false);
      }
    };



  // Lógica de filtragem dos produtos em tempo real
  const itensFiltrados = itens.filter(item => {
    const termo = searchItemTerm.toLowerCase();
    const matchBusca = item.name.toLowerCase().includes(termo) ||
                       (item.description && item.description.toLowerCase().includes(termo));

    const matchCategoria = selectedCategoryFilter === '' || item.category === parseInt(selectedCategoryFilter);

    return matchBusca && matchCategoria;
  });

  // Gatilho dinâmico para o botão global "Adicionar Novo" no topo
  const handleBotaoAdicionarGlobal = () => {
    if (activeTab === 'categorias') abrirModalCategoria();
    else if (activeTab === 'itens') abrirModalItem();
    else if (activeTab === 'mesas') abrirModalMesa();
  };

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col relative">
      <header className="mb-6 sm:mb-8 border-b border-dark-border pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Gestão do Cardápio e Salão</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Gerencie suas categorias, produtos e mesas físicas.</p>
        </div>

        <button
          onClick={handleBotaoAdicionarGlobal}
          className="bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-2.5 px-4 sm:py-3 sm:px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex-shrink-0 text-xs sm:text-sm active:scale-95"
        >
          <Plus size={18} />
          <span>Adicionar Novo</span>
        </button>
      </header>

      {/* Navegação por Abas Responsiva */}
      <div className="flex gap-4 sm:gap-6 mb-6 border-b border-dark-border overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('categorias')}
          className={`pb-3 font-bold text-sm sm:text-base transition-colors relative whitespace-nowrap ${activeTab === 'categorias' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
        >
          Categorias ({categorias.length})
          {activeTab === 'categorias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('itens')}
          className={`pb-3 font-bold text-sm sm:text-base transition-colors relative whitespace-nowrap ${activeTab === 'itens' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
        >
          Produtos ({itens.length})
          {activeTab === 'itens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('mesas')}
          className={`pb-3 font-bold text-sm sm:text-base transition-colors relative whitespace-nowrap ${activeTab === 'mesas' ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
        >
          Mesas do Salão ({mesas.length})
          {activeTab === 'mesas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-t-full" />}
        </button>
      </div>

      <div className="flex-1 pb-20">
        {/* --- ABA: CATEGORIAS --- */}
        {activeTab === 'categorias' && (
          <div className="animate-fade-in max-w-2xl">
            {categorias.length > 0 ? (
              <ul className="divide-y divide-dark-border border border-dark-border rounded-2xl bg-dark-card overflow-hidden shadow-sm">
                {categorias.map(cat => (
                  <li key={cat.id} className="p-3.5 sm:p-4 flex justify-between items-center hover:bg-dark-bg/60 transition-colors group">
                    <span className="text-white font-bold text-base sm:text-lg">{cat.name}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => abrirModalCategoria(cat)}
                        className="p-2 text-gray-400 hover:text-gold-500 bg-dark-bg rounded-xl border border-dark-border hover:border-gold-500/30 transition-all"
                        title="Editar categoria"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => solicitarExclusaoCategoria(cat)}
                        className="p-2 text-gray-400 hover:text-red-500 bg-dark-bg rounded-xl border border-dark-border hover:border-red-500/30 transition-all"
                        title="Excluir categoria"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-10 bg-dark-card border border-dark-border rounded-2xl">
                Nenhuma categoria cadastrada.
              </p>
            )}
          </div>
        )}

        {/* --- ABA: ITENS (PRODUTOS) --- */}
        {activeTab === 'itens' && (
          <div className="animate-fade-in flex flex-col">
            {/* PAINEL DE FILTROS E BUSCA INTELIGENTE */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-dark-card p-3 sm:p-4 rounded-2xl border border-dark-border shadow-sm">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produto por nome ou descrição..."
                  value={searchItemTerm}
                  onChange={(e) => setSearchItemTerm(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-xl p-2.5 sm:p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 transition-colors sm:w-52 cursor-pointer font-medium"
              >
                <option value="">Todas as Categorias</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Grid de Exibição dos Itens Filtrados */}
            {itensFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {itensFiltrados.map(item => (
                  <div key={item.id} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden flex flex-col group hover:border-gold-500/40 transition-all shadow-sm">
                    {/* Imagem do Produto */}
                    <div className="h-36 sm:h-40 bg-dark-bg relative border-b border-dark-border flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="text-gray-600 flex flex-col items-center gap-1.5">
                          <ImageIcon size={28} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Sem Foto</span>
                        </div>
                      )}

                      {/* Desktop Hover Overlay para edição rápida */}
                      <div className="hidden sm:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-3 backdrop-blur-sm">
                        <button
                          onClick={() => abrirModalItem(item)}
                          className="p-2.5 bg-dark-card text-gold-500 hover:text-white border border-gold-500 rounded-xl transition-all hover:scale-110 shadow-lg"
                          title="Editar produto"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => solicitarExclusaoItem(item)}
                          className="p-2.5 bg-dark-card text-red-500 hover:text-white border border-red-500 rounded-xl transition-all hover:scale-110 shadow-lg"
                          title="Excluir produto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-white text-base leading-tight truncate">{item.name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${item.is_available !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-red-950 text-red-400 border border-red-500/20'}`}>
                          {item.is_available !== false ? 'Ativo' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-gold-500 font-extrabold text-lg sm:text-xl font-mono mb-1.5">
                        R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-gray-400 text-xs line-clamp-2 mt-auto">
                        {item.description || 'Nenhuma descrição fornecida.'}
                      </p>

                      {/* Botões de Ação Diretos (Essenciais para Tablets e Smartphones onde hover não existe) */}
                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-dark-border/60">
                        <button
                          type="button"
                          onClick={() => abrirModalItem(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border hover:border-gold-500/40 text-gold-500 font-bold text-xs transition-colors active:scale-95"
                          title="Editar este produto"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => solicitarExclusaoItem(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border hover:border-red-500/40 text-red-400 font-bold text-xs transition-colors active:scale-95"
                          title="Excluir este produto"
                        >
                          <Trash2 size={13} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center text-gray-500">
                {searchItemTerm || selectedCategoryFilter ? "Nenhum produto corresponde aos filtros aplicados." : "Nenhum produto cadastrado."}
              </div>
            )}
          </div>
        )}

        {/* --- ABA: MESAS DO SALÃO --- */}
        {activeTab === 'mesas' && (
          <div className="animate-fade-in max-w-2xl">
            {mesas.length > 0 ? (
              <ul className="divide-y divide-dark-border border border-dark-border rounded-2xl bg-dark-card overflow-hidden shadow-sm">
                {mesas.map(m => (
                  <li key={m.id} className="p-3.5 sm:p-4 flex justify-between items-center hover:bg-dark-bg/60 transition-colors group">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-white font-bold text-base sm:text-lg">{m.identification}</span>
                      <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full font-extrabold tracking-wider ${m.status === 'Livre' || m.status === 'livre' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-amber-950 text-gold-500 border border-gold-500/20'}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => abrirModalMesa(m)}
                        className="p-2 text-gray-400 hover:text-gold-500 bg-dark-bg rounded-xl border border-dark-border hover:border-gold-500/30 transition-all"
                        title="Editar mesa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => solicitarExclusaoMesa(m)}
                        className={`p-2 rounded-xl border border-dark-border transition-all ${(m.status || '').toLowerCase() === 'ocupada' ? 'text-gray-700 bg-transparent cursor-not-allowed border-transparent' : 'text-gray-400 hover:text-red-500 bg-dark-bg hover:border-red-500/30'}`}
                        disabled={(m.status || '').toLowerCase() === 'ocupada'}
                        title={(m.status || '').toLowerCase() === 'ocupada' ? "Não é possível remover mesas ocupadas" : "Excluir mesa"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-10 bg-dark-card border border-dark-border rounded-2xl">
                Nenhuma mesa cadastrada.
              </p>
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

              <div className="flex items-center gap-3 bg-dark-bg p-3 rounded-xl border border-dark-border">
                <input
                  type="checkbox"
                  id="chk-disponivel"
                  checked={itemFormData.is_available}
                  onChange={(e) => setItemFormData({...itemFormData, is_available: e.target.checked})}
                  className="w-5 h-5 rounded text-gold-500 accent-gold-500 cursor-pointer"
                />
                <label htmlFor="chk-disponivel" className="text-sm font-bold text-white cursor-pointer select-none">
                  Disponível no Cardápio Digital (Clientes podem ver)
                </label>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 mt-2 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: FORMULÁRIO DE MESA
      ========================================= */}
      {isMesaModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{mesaFormData.id ? 'Editar Mesa' : 'Nova Mesa'}</h2>
              <button onClick={() => setIsMesaModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={salvarMesa} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Identificação da Mesa</label>
                <input
                  type="text"
                  value={mesaFormData.identification || ''}
                  onChange={(e) => setMesaFormData({...mesaFormData, identification: e.target.value})}
                  placeholder="Ex: Mesa 12 ou Balcão Superior"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  autoFocus
                  required
                />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 mt-4 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Mesa'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* =========================================
          MODAL CUSTOMIZADO DE EXCLUSÃO (POPUP)
      ========================================= */}
      <DeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executarExclusaoConfirmada}
        title={
          deleteTarget.type === 'categoria' ? 'Excluir Categoria' :
          deleteTarget.type === 'item' ? 'Excluir Produto' : 'Excluir Mesa'
        }
        itemName={deleteTarget.name}
        message={
          deleteTarget.type === 'categoria' ? 'Tem certeza que deseja excluir esta categoria? Os itens vinculados precisam ser realocados antes.' :
          deleteTarget.type === 'item' ? 'Tem certeza que deseja excluir este produto do cardápio? Pedidos anteriores no histórico não serão afetados.' :
          'Tem certeza que deseja excluir esta mesa do salão?'
        }
      />
    </div>
  );
}