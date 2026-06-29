import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
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
      // Modifique o endpoint abaixo caso seu Django use '/api/token/' para JWT
      const response = await api.post('token/', {
        username: formData.username,
        password: formData.password
      });

      // Salva o token recuperado no navegador
      const token = response.data.token || response.data.access;
      localStorage.setItem('@RestM:token', token);

      // Aplica o token automaticamente para todas as próximas requisições da API
      api.defaults.headers.common['Authorization'] = `Token ${token}`;

      // Direciona o funcionário direto para o painel de mesas
      navigate('/');
    } catch (error) {
        console.error("Erro completo na autenticação:", error);

        // CAPTURA CIRÚRGICA: Pega o erro real que veio do Django
        const backendErro = error.response?.data
          ? JSON.stringify(error.response.data)
          : `Status: ${error.response?.status || 'Sem conexão com o servidor'}`;

        setErro(`Falha no Login. Detalhes: ${backendErro}`);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1E1E1E] border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-fade-in">

        {/* Cabeçalho do Login */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Rest<span className="text-gold-500">M</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Painel de Atendimento do Restaurante</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Campo Usuário */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Usuário / Operador</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Senha de Acesso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3.5 pl-10 pr-12 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botão de Entrar */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-3.5 mt-2 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] disabled:opacity-50 text-sm tracking-wide"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
}