import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutGrid,
  Package,
  ReceiptText,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  QrCode,
  Printer
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import QrCodeModal from '../common/QrCodeModal';

export default function Layout({ children }) {
  // Aberto por padrão em telas grandes (Desktop >= 1024px), fechado em celulares e tablets
  const [isMenuOpen, setIsMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState({ id: 1, name: 'Restaurante da Esquina', slug: 'restaurante-da-esquina' });
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  const navLinks = [
    { name: 'Mesas', path: '/', icon: <LayoutGrid size={20} /> },
    { name: 'Gestão de Itens', path: '/gestao', icon: <Package size={20} /> },
    { name: 'Histórico Protegido', path: '/historico', icon: <ReceiptText size={20} /> },
    { name: 'Relatórios', path: '/relatorios', icon: <BarChart3 size={20} /> },
    { name: 'Configurações', path: '/configuracoes', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    api.get('me/')
      .then(res => {
        if (res.data?.tenant) {
          setTenantInfo(res.data.tenant);
        }
      })
      .catch(() => {});
  }, []);

  // Atualiza dinamicamente o título da aba do navegador com o nome da tela e RestM
  useEffect(() => {
    let activeNav = navLinks.find(l => l.path === location.pathname)?.name;
    if (!activeNav && location.pathname.startsWith('/mesa')) {
      activeNav = 'Atendimento de Mesa';
    }
    if (activeNav) {
      document.title = `${activeNav} • ${tenantInfo.name || 'RestM'}`;
    } else {
      document.title = `RestM - ${tenantInfo.name || 'Sistema para Restaurantes'}`;
    }
  }, [location.pathname, tenantInfo]);

  const fecharMenu = () => setIsMenuOpen(false);
  const abrirMenu = () => setIsMenuOpen(true);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  // Ação ao clicar no logo RM
  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Celular: fecha a gaveta e vai para mesas
      fecharMenu();
      navigate('/');
    } else {
      // Desktop: recolhe/expande o menu lateral mantendo os ícones alinhados
      toggleMenu();
    }
  };

  // Fecha o menu automaticamente apenas em celulares ao clicar nos links de navegação
  const handleNavLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      fecharMenu();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@RestM:token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const cardapioUrl = `/cardapio/${tenantInfo.slug || 'matriz'}`;
  const telaAtualNome = location.pathname.startsWith('/mesa')
    ? 'Atendimento de Mesa'
    : (navLinks.find(l => l.path === location.pathname)?.name || 'RestM');

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col transition-colors duration-200 relative">

      {/* --- MODAL DE QR CODE PERMANENTE PARA MESAS --- */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tenant={tenantInfo}
      />

      {/* --- HEADER MOBILE (Exclusivo para celular < 768px - com menu hambúrguer e botão de tema) --- */}
      <div className="md:hidden flex justify-between items-center p-3.5 sm:p-4 bg-dark-card border-b border-dark-border z-30 sticky top-0">
        <button
          type="button"
          onClick={toggleMenu}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          title="Abrir ou fechar menu"
        >
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-500 font-black text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0">
            RM
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white leading-none">
              Rest<span className="text-gold-500">M</span>
            </span>
            <span className="text-[10px] text-gold-500 font-bold truncate max-w-[140px] mt-0.5">
              {tenantInfo.name}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-300 hover:text-gold-500 rounded-xl hover:bg-dark-bg transition-colors"
            title="Alternar Tema"
          >
            {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />}
          </button>
          <button
            type="button"
            onClick={toggleMenu}
            className="text-gold-500 p-2 rounded-xl hover:bg-dark-bg focus:outline-none transition-colors"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* --- MENU LATERAL (DRAWER NO MOBILE / SIDEBAR COLAPSÁVEL NO DESKTOP) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-dark-card border-r border-dark-border flex flex-col
        transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isMenuOpen
          ? 'w-64 translate-x-0'
          : '-translate-x-full md:translate-x-0 md:w-20'
        }
      `}>
        {/* Cabeçalho do Menu: Altura 100% fixa (h-20) para os ícones abaixo nunca teletransportarem na vertical */}
        <div className="h-20 px-3 border-b border-dark-border flex items-center shrink-0">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center w-full h-12 px-2 rounded-2xl focus:outline-none group cursor-pointer overflow-hidden transition-colors hover:bg-dark-bg/60"
            title={isMenuOpen ? "Clique no logo para recolher o menu" : "Clique no logo para expandir o menu"}
          >
            {/* Ícone Logo RM: Posição fixa de 40px (w-10), alinhado verticalmente com todos os ícones abaixo */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0 group-hover:scale-105 transition-transform">
              RM
            </div>

            {/* Texto: RestM e Nome do Restaurante (Transição suave sem empurrar o layout) */}
            <div className={`
              ml-3 flex flex-col text-left min-w-0 transition-all duration-300 ease-in-out
              ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'}
            `}>
              <h1 className="text-xl font-black text-white tracking-tight leading-none whitespace-nowrap">
                Rest<span className="text-gold-500">M</span>
              </h1>
              <span className="text-[11px] font-bold text-gold-500 truncate max-w-[130px] mt-1 whitespace-nowrap block" title={tenantInfo.name}>
                {tenantInfo.name}
              </span>
            </div>
          </button>

          {/* Botão X exclusivo para Celular (nunca visível no Desktop) */}
          {isMenuOpen && (
            <button
              type="button"
              onClick={fecharMenu}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-xl hover:bg-dark-bg transition-colors cursor-pointer shrink-0 ml-auto"
              title="Fechar Menu"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Links de Navegação: Ícones 100% ancorados no eixo X e Y (zero movimento brusco) */}
        <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const isActive = link.path === '/'
              ? (location.pathname === '/' || location.pathname.startsWith('/mesa'))
              : location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={handleNavLinkClick}
                title={!isMenuOpen ? link.name : undefined}
                className={`flex items-center h-12 px-2 rounded-2xl font-bold text-sm transition-colors duration-200 group overflow-hidden ${
                  isActive
                    ? 'bg-gold-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'text-gray-400 hover:bg-dark-bg hover:text-white'
                }`}
              >
                {/* Container do ícone com tamanho fixo (w-10 h-10) perfeitamente centrado no modo colapsado */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {link.icon}
                </div>

                {/* Texto do menu com fade e slide suaves, sem puxar ou empurrar o ícone */}
                <span className={`
                  ml-3 whitespace-nowrap truncate transition-all duration-300 ease-in-out
                  ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'}
                `}>
                  {link.name}
                </span>
              </Link>
            );
          })}

          {/* Atalhos Especiais: Cardápio e QR Code (com ícones ancorados na mesma coluna) */}
          <div className="pt-3 mt-3 border-t border-dark-border space-y-2">
            {/* Cardápio Digital */}
            <a
              href={cardapioUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={!isMenuOpen ? "Cardápio Digital" : undefined}
              className="flex items-center h-11 px-2 rounded-2xl font-bold text-xs bg-dark-bg border border-dark-border text-gold-500 hover:border-gold-500 transition-colors group overflow-hidden"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={18} />
              </div>
              <div className={`
                ml-3 flex items-center justify-between flex-1 min-w-0 transition-all duration-300 ease-in-out
                ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'}
              `}>
                <span className="whitespace-nowrap truncate">Cardápio Digital</span>
                <ExternalLink size={13} className="opacity-70 group-hover:opacity-100 shrink-0 ml-2" />
              </div>
            </a>

            {/* QR Code da Mesa */}
            <button
              type="button"
              onClick={() => {
                setIsQrModalOpen(true);
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  fecharMenu();
                }
              }}
              title={!isMenuOpen ? "QR Code da Mesa" : undefined}
              className="flex items-center w-full h-11 px-2 rounded-2xl font-bold text-xs bg-dark-bg border border-dark-border text-gray-300 hover:text-gold-500 hover:border-gold-500/50 transition-colors group overflow-hidden cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 text-gold-500">
                <QrCode size={18} />
              </div>
              <div className={`
                ml-3 flex items-center justify-between flex-1 min-w-0 transition-all duration-300 ease-in-out
                ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'}
              `}>
                <span className="whitespace-nowrap truncate">QR Code da Mesa</span>
                <Printer size={13} className="opacity-70 group-hover:opacity-100 shrink-0 ml-2" />
              </div>
            </button>
          </div>
        </nav>

        {/* --- BOTÃO DE SAIR (Ícone alinhado permanentemente com os demais) --- */}
        <div className="p-3 border-t border-dark-border mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            title={!isMenuOpen ? "Sair do Sistema" : undefined}
            className="flex w-full items-center h-12 px-2 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer overflow-hidden group"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <LogOut size={18} />
            </div>
            <span className={`
              ml-3 whitespace-nowrap truncate transition-all duration-300 ease-in-out
              ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'}
            `}>
              Sair do Sistema
            </span>
          </button>
        </div>
      </aside>

      {/* --- OVERLAY EXCLUSIVO PARA CELULAR (Fecha o menu ao clicar fora) --- */}
      {isMenuOpen && (
        <div
          onClick={fecharMenu}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL (Padding ajustado dinamicamente: pl-64 aberto, pl-20 colapsado sem estourar 100% da viewport) --- */}
      <div className={`
        flex-1 flex flex-col min-h-screen overflow-x-hidden w-full transition-all duration-300 ease-in-out
        ${isMenuOpen ? 'md:pl-64' : 'md:pl-20'}
      `}>
        {/* --- MENU SUPERIOR DESKTOP (Sem botão hambúrguer e sem X - apenas identificação e tema) --- */}
        <header className="hidden md:flex sticky top-0 z-30 w-full bg-dark-card/95 backdrop-blur-md border-b border-dark-border px-4 md:px-8 py-3 items-center justify-between shadow-sm transition-colors">
          {/* Esquerda: Identificação da Tela Atual */}
          <div className="flex items-center gap-2.5">
            <span className="text-base font-extrabold text-white">
              {telaAtualNome}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-xs font-bold text-gold-500 bg-gold-500/10 px-2.5 py-0.5 rounded-full border border-gold-500/20">
              {tenantInfo.name}
            </span>
          </div>

          {/* Direita: Apenas o Botão de Tema (Modo Claro / Escuro) */}
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dark-bg border border-dark-border hover:border-gold-500/60 text-gray-300 hover:text-white transition-all shadow-sm group cursor-pointer"
              title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {isDark ? (
                <>
                  <Sun size={16} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                  <span className="text-xs font-bold">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-indigo-400 group-hover:-rotate-12 transition-transform" />
                  <span className="text-xs font-bold">Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
