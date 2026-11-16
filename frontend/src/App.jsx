import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/dashboard/Layout';
import Dashboard from './pages/Dashboard';
import Mesa from './pages/Mesa';
import Historico from './pages/Historico';
import Gestao from './pages/Gestao';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import CardapioPublico from './pages/CardapioPublico';
import Login from './pages/Login';
import api from './services/api';

// 🛡️ Componente para interceptar e bloquear acessos de usuários deslogados
function RotaProtegida({ children }) {
  const token = localStorage.getItem('@RestM:token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Mantém o cabeçalho Authorization sincronizado
  api.defaults.headers.common['Authorization'] = `Token ${token}`;

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 🚪 Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cardapio/:slug" element={<CardapioPublico />} />
          <Route path="/cardapio/t/:slug" element={<CardapioPublico />} />
          <Route path="/cardapio" element={<CardapioPublico />} />

          {/* 🔐 Telas Protegidas com Menu de Navegação */}
          <Route path="/" element={
            <RotaProtegida>
              <Layout><Dashboard /></Layout>
            </RotaProtegida>
          } />
          <Route path="/gestao" element={
            <RotaProtegida>
              <Layout><Gestao /></Layout>
            </RotaProtegida>
          } />
          <Route path="/historico" element={
            <RotaProtegida>
              <Layout><Historico /></Layout>
            </RotaProtegida>
          } />
          <Route path="/relatorios" element={
            <RotaProtegida>
              <Layout><Relatorios /></Layout>
            </RotaProtegida>
          } />
          <Route path="/configuracoes" element={
            <RotaProtegida>
              <Layout><Configuracoes /></Layout>
            </RotaProtegida>
          } />

          {/* 🔐 Rota Privada para Atendimento de Mesas (Integrada ao Menu de Navegação) */}
          <Route path="/mesa/:id" element={
            <RotaProtegida>
              <Layout><Mesa /></Layout>
            </RotaProtegida>
          } />

          {/* Rota de Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
