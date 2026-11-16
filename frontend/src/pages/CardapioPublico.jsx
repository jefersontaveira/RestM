import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Clock,
  Phone,
  MapPin,
  Sun,
  Moon,
  UtensilsCrossed,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  ExternalLink,
  LayoutGrid
} from 'lucide-react';
import axios from 'axios';

export default function CardapioPublico() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [isModalCategoriasOpen, setIsModalCategoriasOpen] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(() => {
    return localStorage.getItem('@RestM:menu_theme') !== 'light';
  });

  const categoryScrollRef = useRef(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

  useEffect(() => {
    carregarCardapio();
  }, [slug]);

  useEffect(() => {
    if (dados?.tenant?.name) {
      document.title = `${dados.tenant.name} - Cardápio Digital | RestM`;
    } else {
      document.title = 'Cardápio Digital | RestM';
    }
  }, [dados]);

  const carregarCardapio = async () => {
    try {
      setLoading(true);
      setErro('');
      const targetSlug = slug || 'matriz';
      const res = await axios.get(`${apiBaseUrl}cardapio/${targetSlug}/`);
      setDados(res.data);
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
      setErro('Restaurante ou cardápio não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTema = () => {
    setModoEscuro(prev => {
      const novo = !prev;
      localStorage.setItem('@RestM:menu_theme', novo ? 'dark' : 'light');
      return novo;
    });
  };

  const scrollCategorias = (direcao) => {
    if (categoryScrollRef.current) {
      const distancia = direcao === 'esq' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: distancia, behavior: 'smooth' });
    }
  };

  const handleSelecionarCategoria = (catId) => {
    setCategoriaAtiva(catId);
    setIsModalCategoriasOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`cat-chip-${catId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 text-amber-500">
        <UtensilsCrossed size={48} className="animate-spin mb-4" />
        <p className="font-bold text-lg">Carregando cardápio digital...</p>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={56} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Cardápio Indisponível</h1>
        <p className="text-gray-400 max-w-md">{erro || 'O estabelecimento solicitado não foi localizado.'}</p>
      </div>
    );
  }

  const { tenant, categorias } = dados;
  const primaryColor = tenant.primary_color || '#F59E0B';

  // Coleta todos os itens das categorias
  const todosItens = categorias.flatMap(c =>
    (c.items || []).map(i => ({ ...i, categoriaNome: c.name, categoriaId: c.id }))
  );

  // Filtragem por busca e categoria
  const itensFiltrados = todosItens.filter(item => {
    const combinaCategoria = categoriaAtiva === 'todas' || item.categoriaId === categoriaAtiva;
    const combinaBusca =
      !termoBusca ||
      item.name.toLowerCase().includes(termoBusca.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(termoBusca.toLowerCase()));
    return combinaCategoria && combinaBusca;
  });

  // URLs de Ação: WhatsApp e Google Maps
  const cleanPhone = (tenant.phone || '').replace(/\D/g, '').replace(/^55/, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá! Acessei o cardápio digital do ${tenant.name} e gostaria de mais informações.`
  )}`;

  const fullAddress = tenant.address || '';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${modoEscuro ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'
        }`}
    >
      {/* --- MODAL / GAVETA DE CATEGORIAS PARA MOBILE --- */}
      {isModalCategoriasOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 border shadow-2xl transition-colors ${modoEscuro ? 'bg-[#1C1C1E] border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
              <div className="flex items-center gap-2">
                <LayoutGrid size={20} style={{ color: primaryColor }} />
                <h3 className="font-extrabold text-lg">Todas as Categorias</h3>
              </div>
              <button
                onClick={() => setIsModalCategoriasOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              <button
                onClick={() => handleSelecionarCategoria('todas')}
                className={`flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all text-left ${categoriaAtiva === 'todas'
                    ? 'text-black shadow-md'
                    : modoEscuro ? 'bg-zinc-900 hover:bg-zinc-800 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                style={{ backgroundColor: categoriaAtiva === 'todas' ? primaryColor : undefined }}
              >
                <span>Todos os Itens</span>
                <span className="text-xs opacity-75 font-mono">({todosItens.length})</span>
              </button>

              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSelecionarCategoria(cat.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all text-left ${categoriaAtiva === cat.id
                      ? 'text-black shadow-md'
                      : modoEscuro ? 'bg-zinc-900 hover:bg-zinc-800 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  style={{ backgroundColor: categoriaAtiva === cat.id ? primaryColor : undefined }}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <span className="text-xs opacity-75 font-mono shrink-0">({cat.items?.length || 0})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER BANNER / IDENTIDADE --- */}
      <header
        className={`relative border-b transition-colors ${modoEscuro ? 'bg-[#1C1C1E] border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Linha Superior: Logo + Nome + Status + Alternador de Tema */}
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover shadow-md border border-white/10 shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center text-black font-extrabold text-xl sm:text-2xl shadow-md shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                  {tenant.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Status Aberto / Fechado */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${tenant.is_open
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${tenant.is_open ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}
                    />
                    {tenant.is_open ? 'Aberto Agora' : 'Fechado no Momento'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternador de Tema do Visitante */}
            <button
              onClick={toggleTema}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-colors shrink-0 ${modoEscuro
                  ? 'bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              title={modoEscuro ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {modoEscuro ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Linha de Ações Interativas: WhatsApp e Google Maps */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-inherit">
            {tenant.phone && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs sm:text-sm transition-all shadow-sm group active:scale-95"
                title="Abrir WhatsApp para pedidos e dúvidas"
              >
                <MessageCircle size={16} className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>{tenant.phone}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  WhatsApp
                </span>
              </a>
            )}

            {tenant.address && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 text-amber-300 font-medium text-xs sm:text-sm transition-all shadow-sm group active:scale-95"
                title="Abrir endereço no Google Maps"
              >
                <MapPin size={16} className="text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-md">{tenant.address}</span>
                <ExternalLink size={12} className="opacity-70 group-hover:opacity-100 shrink-0" />
              </a>
            )}
          </div>

          {/* Barra de Pesquisa */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por prato, carne, bebida, porção ou sobremesa..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className={`w-full py-2.5 pl-10 pr-9 rounded-2xl text-xs sm:text-sm border focus:outline-none transition-colors ${modoEscuro
                  ? 'bg-[#121212] border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                }`}
            />
            {termoBusca && (
              <button
                onClick={() => setTermoBusca('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* --- CARROSSEL DE CATEGORIAS FIXO / STICKY (CHIPS RESPONSIVOS) --- */}
        <div className={`sticky top-0 z-30 border-t backdrop-blur-md shadow-md transition-colors ${modoEscuro ? 'border-zinc-800 bg-[#1C1C1E]/95' : 'border-gray-200 bg-white/95'
          }`}>
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 sm:gap-2">

            {/* Botão para Abrir Grade/Lista de Todas as Categorias no Celular */}
            <button
              onClick={() => setIsModalCategoriasOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 shadow-sm ${modoEscuro
                  ? 'bg-zinc-800 border-zinc-700 text-gold-500 hover:bg-zinc-700'
                  : 'bg-gray-100 border-gray-300 text-gold-600 hover:bg-gray-200'
                }`}
              title="Ver todas as categorias em lista"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Categorias</span>
            </button>

            {/* Botão Rolar para Esquerda */}
            <button
              onClick={() => scrollCategorias('esq')}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-sm shrink-0 transition-colors ${modoEscuro ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              title="Rolar categorias para esquerda"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Container Horizontal com Scroll Suave, Touch Pan e sem quebra */}
            <div
              ref={categoryScrollRef}
              className="flex-1 overflow-x-auto scroll-smooth flex items-center gap-2 py-1 px-1 scrollbar-none touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                id="cat-chip-todas"
                onClick={() => handleSelecionarCategoria('todas')}
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all shadow-sm"
                style={{
                  backgroundColor: categoriaAtiva === 'todas' ? primaryColor : (modoEscuro ? '#262626' : '#E5E7EB'),
                  color: categoriaAtiva === 'todas' ? '#000000' : (modoEscuro ? '#D4D4D8' : '#374151')
                }}
              >
                Todos ({todosItens.length})
              </button>

              {categorias.map(cat => (
                <button
                  key={cat.id}
                  id={`cat-chip-${cat.id}`}
                  onClick={() => handleSelecionarCategoria(cat.id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all shadow-sm"
                  style={{
                    backgroundColor: categoriaAtiva === cat.id ? primaryColor : (modoEscuro ? '#262626' : '#E5E7EB'),
                    color: categoriaAtiva === cat.id ? '#000000' : (modoEscuro ? '#D4D4D8' : '#374151')
                  }}
                >
                  {cat.name} ({cat.items?.length || 0})
                </button>
              ))}

              {/* Espaçador de Respiro no Final para que o último chip NUNCA seja cortado no celular */}
              <div className="w-10 shrink-0 h-4 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Botão Rolar para Direita */}
            <button
              onClick={() => scrollCategorias('dir')}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-sm shrink-0 transition-colors ${modoEscuro ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              title="Rolar categorias para direita"
              aria-label="Rolar para direita"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* --- GRID DE PRODUTOS ULTRA-RESPONSIVO --- */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {itensFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {itensFiltrados.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex gap-3 sm:gap-4 ${modoEscuro
                    ? 'bg-[#1C1C1E] border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
              >
                {/* Detalhes do Produto */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                      style={{ color: primaryColor }}
                    >
                      {item.categoriaNome}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg leading-tight mb-1.5">{item.name}</h3>
                    {item.description && (
                      <p className={`text-xs line-clamp-2 mb-2 ${modoEscuro ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-extrabold font-mono" style={{ color: primaryColor }}>
                      R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Foto do Produto */}
                {item.image ? (
                  <div className="w-22 h-22 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-zinc-800 shadow-inner">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-22 h-22 sm:w-28 sm:h-28 rounded-2xl shrink-0 bg-zinc-800/40 border border-zinc-700/50 flex flex-col items-center justify-center text-gray-500">
                    <UtensilsCrossed size={24} className="opacity-40 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Sem foto</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`text-center py-16 px-4 rounded-2xl border ${modoEscuro ? 'bg-[#1C1C1E] border-zinc-800 text-zinc-400' : 'bg-white border-gray-200 text-gray-500'
              }`}
          >
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-lg">Nenhum item encontrado.</p>
            <p className="text-xs mt-1">Tente pesquisar por outro termo ou selecione outra categoria.</p>
          </div>
        )}
      </main>

      {/* --- RODAPÉ --- */}
      <footer
        className={`py-6 border-t text-center text-xs transition-colors ${modoEscuro ? 'bg-[#121212] border-zinc-800 text-zinc-500' : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}
      >
        <p>© {new Date().getFullYear()} {tenant.name} • Desenvolvido com RestM</p>
      </footer>
    </div>
  );
}
