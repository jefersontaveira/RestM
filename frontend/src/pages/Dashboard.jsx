import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('mesas/')
      .then(response => {
        setTables(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar mesas:", error);
      });
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      {/* Cabeçalho Limpo */}
      <header className="mb-8 border-b border-dark-border pb-4">
        <h1 className="text-3xl font-bold text-gold-500">Controle de Mesas</h1>
        <p className="text-gray-400 mt-2">Selecione uma mesa para iniciar ou gerenciar o atendimento.</p>
      </header>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {tables.map(table => {
          const isOcupada = table.status === 'ocupada';

          return (
            <button
              key={table.id}
              onClick={() => navigate(`/mesa/${table.id}`)}
              className={`
                p-6 rounded-xl flex flex-col items-center justify-center transition-all duration-300
                ${isOcupada
                  ? 'bg-dark-card border-2 border-gold-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-dark-card border-2 border-dark-border hover:border-gray-500'
                }
              `}
            >
              <span className={`text-2xl font-bold ${isOcupada ? 'text-gold-400' : 'text-white'}`}>
                {table.identification}
              </span>
              <span className={`text-sm mt-2 uppercase tracking-wider ${isOcupada ? 'text-gold-600' : 'text-gray-500'}`}>
                {table.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}