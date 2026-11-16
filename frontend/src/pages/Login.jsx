import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) return;

    setLoading(true);
    setErro('');

    try {
      const response = await api.post('token/', {
        username: formData.username,
        password: formData.password
      });

      const token = response.data.token || response.data.access;
      localStorage.setItem('@RestM:token', token);
      if (response.data.tenant) {
        localStorage.setItem('@RestM:tenant', JSON.stringify(response.data.tenant));
      }

      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      navigate('/');
    } catch (error) {
      console.error("Erro completo na autenticação:", error);
      const backendErro = error.response?.data
        ? JSON.stringify(error.response.data)
        : `Status: ${error.response?.status || 'Sem conexão com o servidor'}`;
      setErro(`Falha no login. Verifique seu usuário e senha.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md bg-[#1E1E1E] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">

        {/* Cabeçalho do Login com Logo RestM */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.35)] mb-3">
            RM
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Rest<span className="text-gold-500">M</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Painel Operacional para Restaurantes</p>
        </div>

        {erro && (
          <div className="mb-4 p-3.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs sm:text-sm rounded-xl text-center font-bold animate-fade-in">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
          {/* Campo Usuário */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">
              Usuário / Operador
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Ex: admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 transition-colors"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-11 text-white text-xs sm:text-sm focus:outline-none focus:border-gold-500 transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botão de Entrar */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-3.5 mt-2 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 text-sm tracking-wide active:scale-95 cursor-pointer"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
}
