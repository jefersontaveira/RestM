import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/dashboard/Layout';
import Dashboard from './pages/Dashboard';
import Mesa from './pages/Mesa';
import Historico from './pages/Historico';
import Login from './pages/Login';
import Gestao from './pages/Gestao';
import api from './services/api';

// 🛡️ Componente para interceptar e bloquear acessos de usuários deslogados
function RotaProtegida({ children }) {
  const token = localStorage.getItem('@RestM:token');

  if (!token) {
    // Se não tiver token, joga o funcionário de volta para o Login
    return <Navigate to="/login" replace />;
  }

  // Garante que o Axios continue usando o token armazenado no cabeçalho das requisições
  api.defaults.headers.common['Authorization'] = `Token ${token}`;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🚪 Rota Pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* 🔐 Telas que possuem o Menu de Navegação (Protegidas) */}
        <Route path="/" element={
          <RotaProtegida>
            <Layout><Dashboard /></Layout>
          </RotaProtegida>
        } />
        <Route path="/historico" element={
          <RotaProtegida>
            <Layout><Historico /></Layout>
          </RotaProtegida>
        } />
        <Route path="/gestao" element={
          <RotaProtegida>
            <Layout>
              <Gestao />
            </Layout>
          </RotaProtegida>
        } />

        {/* 🔐 Rota Privada Focada para Atendimento de Mesas */}
        <Route path="/mesa/:id" element={<RotaProtegida><Mesa /></RotaProtegida>} />

        {/* Rota de Fallback: Se digitar qualquer endereço errado, joga para o Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;