import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutGrid, Package, ReceiptText, LogOut } from 'lucide-react';

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Nossas rotas principais do Menu
  const navLinks = [
    { name: 'Mesas', path: '/', icon: <LayoutGrid size={20} /> },
    { name: 'Gestão de Itens', path: '/gestao', icon: <Package size={20} /> },
    { name: 'Histórico', path: '/historico', icon: <ReceiptText size={20} /> },
  ];

  const fecharMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    // Remove o token do armazenamento local e redireciona para o login
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col md:flex-row">

      {/* --- HEADER MOBILE (Hambúrguer) --- */}
      <div className="md:hidden flex justify-between items-center p-4 bg-dark-card border-b border-dark-border z-40 sticky top-0">
        <h1 className="text-xl font-bold text-gold-500">Restaurante MVP</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gold-500 p-2 focus:outline-none">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- MENU LATERAL (Sidebar no Desktop / Gaveta no Mobile) --- */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 flex flex-col
      `}>
        {/* Logo visível apenas no Desktop */}
        <div className="p-6 hidden md:block border-b border-dark-border">
          <h1 className="text-2xl font-bold text-gold-500 tracking-wide">Restaurante<br/>MVP</h1>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-3 mt-16 md:mt-0">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={fecharMenu}
                className={`flex items-center gap-3 px-4 py-4 md:py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'bg-gold-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-gray-400 hover:bg-dark-bg hover:text-white'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* --- BOTÃO DE SAIR (Rodapé do Menu) --- */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </div>

      {/* --- OVERLAY MOBILE (Fundo escuro ao abrir o menu) --- */}
      {isMenuOpen && (
        <div
          onClick={fecharMenu}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}