import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/dashboard/Layout';
import Dashboard from './pages/Dashboard';
import Mesa from './pages/Mesa';
import Historico from './pages/Historico';
import Gestao from './pages/Gestao';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Telas que possuem o Menu de Navegação */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/historico" element={<Layout><Historico /></Layout>} />
        <Route path="/gestao" element={<Layout><Gestao /></Layout>} />

        {/* Tela focada de Atendimento (sem menu lateral) */}
        <Route path="/mesa/:id" element={<Mesa />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;