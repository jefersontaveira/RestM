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

  // Fecha o menu automaticamente apenas em dispositivos móveis ao navegar
  const handleNavLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
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

      {/* --- HEADER MOBILE (Celular / Tablet Pequeno < 768px) --- */}
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

      {/* --- MENU LATERAL (DRAWER / SIDEBAR TOTALMENTE CONTROLÁVEL) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border flex flex-col
        transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Cabeçalho do Menu: Logo RestM que fecha o menu e vai pra Home + Botão X */}
        <div className="p-5 sm:p-6 border-b border-dark-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              fecharMenu();
              navigate('/');
            }}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            title="Ir para o início e fechar o menu"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0 group-hover:scale-105 transition-transform">
              RM
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                Rest<span className="text-gold-500">M</span>
              </h1>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Painel Operacional
              </span>
            </div>
          </button>

          {/* Botão de Fechar Direto (funciona em Desktop e Mobile) */}
          <button
            type="button"
            onClick={fecharMenu}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-dark-bg transition-colors cursor-pointer"
            title="Fechar / Recolher Menu"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-faixa com nome do Restaurante / Unidade */}
        <div className="px-6 py-2.5 bg-dark-bg/60 border-b border-dark-border/60">
          <p className="text-xs font-bold text-gold-500 truncate" title={tenantInfo.name}>
            {tenantInfo.name}
          </p>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = link.path === '/'
              ? (location.pathname === '/' || location.pathname.startsWith('/mesa'))
              : location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={handleNavLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-gold-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'text-gray-400 hover:bg-dark-bg hover:text-white'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}

          {/* Atalho Especial: Abrir Cardápio Público */}
          <div className="pt-4 mt-4 border-t border-dark-border space-y-2">
            <a
              href={cardapioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs bg-dark-bg border border-dark-border text-gold-500 hover:border-gold-500 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed size={16} />
                <span>Cardápio Digital</span>
              </div>
              <ExternalLink size={14} className="opacity-70 group-hover:opacity-100" />
            </a>

            {/* Atalho Especial: Imprimir QR Code da Mesa */}
            <button
              type="button"
              onClick={() => {
                setIsQrModalOpen(true);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  fecharMenu();
                }
              }}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl font-bold text-xs bg-dark-bg border border-dark-border text-gray-300 hover:text-gold-500 hover:border-gold-500/50 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <QrCode size={16} className="text-gold-500" />
                <span>QR Code da Mesa</span>
              </div>
              <Printer size={14} className="opacity-70 group-hover:opacity-100" />
            </button>
          </div>
        </nav>

        {/* --- BOTÃO DE SAIR (Rodapé Fixo do Menu) --- */}
        <div className="p-4 border-t border-dark-border mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* --- OVERLAY PARA DISPOSITIVOS MÓVEIS (Fecha o menu ao clicar fora) --- */}
      {isMenuOpen && (
        <div
          onClick={fecharMenu}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL (Margem dinâmica ajustada suavemente) --- */}
      <div className={`
        flex-1 flex flex-col min-h-screen overflow-x-hidden w-full transition-all duration-300 ease-in-out
        ${isMenuOpen ? 'md:ml-64' : 'md:ml-0'}
      `}>
        {/* --- MENU SUPERIOR FIXO (Desktop & Tablet >= 768px) --- */}
        <header className="hidden md:flex sticky top-0 z-30 w-full bg-dark-card/95 backdrop-blur-md border-b border-dark-border px-4 md:px-8 py-3 items-center justify-between shadow-sm transition-colors">
          {/* Esquerda: Botão de Abrir/Fechar Menu Lateral + Identificação da Tela Atual */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={toggleMenu}
              className="p-2 rounded-xl bg-dark-bg border border-dark-border hover:border-gold-500/60 text-gray-300 hover:text-gold-500 transition-all shadow-sm active:scale-95 cursor-pointer"
              title={isMenuOpen ? "Fechar / Recolher menu lateral" : "Abrir / Expandir menu lateral"}
              aria-label="Alternar menu lateral"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo compacto se o menu lateral estiver fechado */}
            {!isMenuOpen && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 mr-2 text-left group cursor-pointer animate-fade-in"
                title="Ir para o início (Mesas)"
              >
                <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-500 font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
                  RM
                </div>
                <span className="text-xl font-black text-white leading-none">
                  Rest<span className="text-gold-500">M</span>
                </span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold text-white">
                {telaAtualNome}
              </span>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <span className="text-xs font-bold text-gold-500 bg-gold-500/10 px-2.5 py-0.5 rounded-full border border-gold-500/20 hidden sm:inline-block">
                {tenantInfo.name}
              </span>
            </div>
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
