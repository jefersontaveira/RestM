import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  QrCode,
  Banknote,
  Coins,
  Printer,
  ShoppingBag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../services/api';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mensal'); // 'diario', 'mensal', 'anual'
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  useEffect(() => {
    carregarRelatorios();
  }, [periodo]);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      const res = await api.get(`relatorios/?periodo=${periodo}`);
      setDados(res.data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconeMetodo = (metodo) => {
    switch (metodo) {
      case 'pix':
        return <QrCode className="text-teal-400" size={24} />;
      case 'dinheiro':
        return <Banknote className="text-emerald-400" size={24} />;
      case 'credito':
        return <CreditCard className="text-sky-400" size={24} />;
      case 'debito':
        return <CreditCard className="text-indigo-400" size={24} />;
      default:
        return <Coins className="text-amber-400" size={24} />;
    }
  };

  const getCorMetodo = (metodo) => {
    switch (metodo) {
      case 'pix':
        return 'bg-teal-500';
      case 'dinheiro':
        return 'bg-emerald-500';
      case 'credito':
        return 'bg-sky-500';
      case 'debito':
        return 'bg-indigo-500';
      default:
        return 'bg-amber-500';
    }
  };

  // Cálculo do pico para escala do gráfico de barras
  const maxFaturamento = dados?.serie_temporal?.length
    ? Math.max(...dados.serie_temporal.map(s => s.total || 0), 10)
    : 10;

  const getPeriodoLabel = () => {
    switch (periodo) {
      case 'diario':
        return 'Diário (Últimos 30 dias)';
      case 'anual':
        return 'Anual (Ano Corrente)';
      default:
        return 'Mensal (Mês Atual)';
    }
  };

  return (
    <div className="w-full p-4 md:p-8 flex flex-col">
      {/* Cabeçalho */}
      <header className="mb-8 border-b border-dark-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-500 flex items-center gap-3">
            <BarChart3 size={32} />
            Relatórios Financeiros & Métodos
          </h1>
          <p className="text-gray-400 mt-1">
            Métricas unificadas de faturamento, vendas e métodos de pagamento.
          </p>
        </div>

        {/* ÚNICO E INDEPENDENTE FILTRO MESTRE DE PERÍODO */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-dark-card border border-dark-border rounded-xl p-1 flex shadow-sm">
            <button
              onClick={() => setPeriodo('diario')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                periodo === 'diario'
                  ? 'bg-gold-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Diário (30d)
            </button>
            <button
              onClick={() => setPeriodo('mensal')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                periodo === 'mensal'
                  ? 'bg-gold-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                periodo === 'anual'
                  ? 'bg-gold-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>

          <button
            onClick={() => window.print()}
            title="Imprimir Relatório Completo"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-dark-card hover:bg-zinc-800 border border-dark-border rounded-xl text-gray-300 hover:text-gold-500 transition-colors shadow-sm text-xs font-bold"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gold-500 mt-20 font-bold text-lg animate-pulse">
          Calculando métricas financeiras...
        </div>
      ) : dados ? (
        <div className="space-y-8 pb-12">
          {/* --- CARDS DE KPIS PRINCIPAIS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturamento Total */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Faturamento Total</span>
                <div className="p-2 bg-gold-500/10 rounded-xl text-gold-500">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gold-500 font-mono">
                R$ {dados.faturamento_total.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-[11px] text-gray-400 mt-2 block">
                {periodo === 'diario' ? 'Últimos 30 dias' : periodo === 'anual' ? 'No ano corrente' : 'No mês corrente'}
              </span>
            </div>

            {/* Total de Pedidos */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Pedidos Finalizados</span>
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <Receipt size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white font-mono">
                {dados.total_pedidos}
              </p>
              <span className="text-[11px] text-gray-400 mt-2 block">Contas fechadas e liquidadas</span>
            </div>

            {/* Ticket Médio */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Ticket Médio</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                R$ {dados.ticket_medio.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-[11px] text-gray-400 mt-2 block">Média de gasto por cliente/mesa</span>
            </div>

            {/* Total Troco Devolvido */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Troco Movimentado</span>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <Coins size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-300 font-mono">
                R$ {dados.total_troco.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-[11px] text-gray-400 mt-2 block">Total devolvido em dinheiro</span>
            </div>
          </div>

          {/* --- SEÇÃO: GRÁFICO DE BARRAS DE FATURAMENTO --- */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={22} className="text-gold-500" />
                  <h2 className="text-xl font-bold text-white">
                    Gráfico de Faturamento
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30">
                    {getPeriodoLabel()}
                  </span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Distribuição cronológica do faturamento sincronizada com o filtro selecionado.
                </p>
              </div>

              {/* Ações e Métricas do Gráfico (Sem duplicidade de filtros) */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="bg-dark-bg border border-dark-border px-3.5 py-1.5 rounded-xl font-mono text-xs text-gray-300">
                  <span className="text-gray-500 mr-1.5 uppercase font-sans text-[10px] font-bold">Pico no Período:</span>
                  <strong className="text-gold-500 font-extrabold">R$ {maxFaturamento.toFixed(2).replace('.', ',')}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarTabela(!mostrarTabela)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dark-bg border border-dark-border hover:border-gold-500/50 text-gold-500 text-xs font-bold transition-all shadow-sm"
                >
                  {mostrarTabela ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{mostrarTabela ? 'Ocultar Tabela' : 'Ver Tabela'}</span>
                </button>
              </div>
            </div>

            {/* Container do Gráfico com Escala Y e Barras */}
            <div className="relative pt-6">
              {/* Linhas de Grade de Fundo (Y-Axis) */}
              <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-gray-500 flex justify-end">
                  <span className="text-[10px] font-mono -mt-2.5 mr-1">R$ {maxFaturamento.toFixed(0)}</span>
                </div>
                <div className="border-b border-gray-500 flex justify-end">
                  <span className="text-[10px] font-mono -mt-2.5 mr-1">R$ {(maxFaturamento / 2).toFixed(0)}</span>
                </div>
                <div className="border-b border-gray-500 flex justify-end">
                  <span className="text-[10px] font-mono -mt-2.5 mr-1">R$ 0</span>
                </div>
              </div>

              {/* Área das Barras Verticais */}
              <div className="h-64 flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-thin px-1">
                {dados.serie_temporal.map((item, idx) => {
                  const valor = item.total || 0;
                  const percentual = maxFaturamento > 0 ? (valor / maxFaturamento) * 100 : 0;
                  const alturaBarra = valor > 0 ? Math.max(percentual, 10) : 3;
                  const label = item.data || item.mes;

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip flutuante de alta precisão */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-zinc-900 text-white text-[11px] font-bold py-2 px-3 rounded-xl border border-gold-500/50 shadow-2xl whitespace-nowrap">
                          <span className="text-gold-500 block mb-0.5">
                            {periodo === 'anual' ? `Mês: ${label}` : `Período: ${label}`}
                          </span>
                          <span className="text-sm font-extrabold block">
                            R$ {valor.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-gray-400 font-normal block text-[10px]">
                            {item.pedidos} {item.pedidos === 1 ? 'pedido liquidado' : 'pedidos liquidados'}
                          </span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-zinc-900 border-r border-b border-gold-500/50 transform rotate-45 -mt-1.5" />
                      </div>

                      {/* Rótulo numérico superior para barras ativas */}
                      {valor > 0 && (
                        <span className="text-[10px] font-mono text-gold-500 font-bold mb-1 opacity-90 group-hover:opacity-100 hidden sm:block truncate max-w-full">
                          R${Math.round(valor)}
                        </span>
                      )}

                      {/* A Barra com Gradiente Dourado */}
                      <div
                        style={{ height: `${alturaBarra}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${valor > 0
                          ? 'bg-gradient-to-t from-gold-600 via-gold-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] group-hover:brightness-125 group-hover:scale-y-[1.03] origin-bottom'
                          : 'bg-zinc-800/40 border-t border-zinc-700/60'
                          }`}
                      />

                      {/* Rótulo do Eixo X */}
                      <span className={`text-[10px] sm:text-xs font-semibold mt-2.5 truncate w-full text-center ${valor > 0 ? 'text-gold-400 font-bold' : 'text-gray-500'
                        }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé e Legenda do Gráfico */}
            <div className="mt-6 pt-4 border-t border-dark-border flex flex-wrap items-center justify-between text-xs text-gray-400 gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-gradient-to-t from-gold-600 to-amber-300 shadow-sm" />
                  <span className="font-medium text-white">Faturamento com vendas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-zinc-800 border border-zinc-700" />
                  <span>Sem movimento</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setMostrarTabela(!mostrarTabela)}
                  className="flex items-center gap-1.5 text-gold-500 hover:text-gold-400 font-bold transition-colors"
                >
                  {mostrarTabela ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span>{mostrarTabela ? 'Ocultar Tabela de Valores' : 'Ver Tabela de Valores Detalhada'}</span>
                </button>
              </div>
            </div>

            {/* Tabela Colapsável de Faturamento */}
            {mostrarTabela && (
              <div className="mt-6 pt-6 border-t border-dark-border animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Tabela Detalhada de Valores
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-gray-400 text-xs uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-bold">
                          {periodo === 'anual' ? 'Mês' : 'Data / Dia'}
                        </th>
                        <th className="py-2.5 px-4 font-bold text-center">Qtd. de Pedidos</th>
                        <th className="py-2.5 px-4 font-bold text-right">Faturamento</th>
                        <th className="py-2.5 px-4 font-bold text-right">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-sm">
                      {dados.serie_temporal.map((row, idx) => {
                        const label = row.data || row.mes;
                        const media = row.pedidos > 0 ? row.total / row.pedidos : 0;
                        return (
                          <tr key={idx} className="hover:bg-dark-bg/60 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              {periodo === 'anual' ? `Mês de ${label}` : `Dia ${label}`}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.pedidos > 0 ? 'bg-gold-500/10 text-gold-500' : 'text-gray-500'}`}>
                                {row.pedidos}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              R$ {row.total.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-400">
                              R$ {media.toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* --- SEÇÃO: QUANTITATIVO POR MÉTODO DE PAGAMENTO --- */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard size={22} className="text-gold-500" />
              Quantitativo & Faturamento por Método de Pagamento
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Volume arrecadado e quantidade de transações divididas por cartão, PIX, dinheiro e outros.
            </p>

            {dados.por_metodo_pagamento.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dados.por_metodo_pagamento.map((item) => (
                  <div
                    key={item.metodo}
                    className="bg-dark-bg border border-dark-border rounded-xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getIconeMetodo(item.metodo)}
                          <span className="font-bold text-white text-sm">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full">
                          {item.percentual}%
                        </span>
                      </div>

                      <p className="text-2xl font-bold text-white font-mono mt-2">
                        R$ {item.total.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.quantidade} {item.quantidade === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>

                    {/* Barra de Progresso Visual */}
                    <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
                      <div
                        className={`h-full ${getCorMetodo(item.metodo)} transition-all duration-500`}
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhum pagamento registrado no período selecionado.
              </div>
            )}
          </div>

          {/* --- SEÇÃO: TOP 5 PRODUTOS MAIS VENDIDOS --- */}
          {dados.top_itens && dados.top_itens.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <ShoppingBag size={22} className="text-gold-500" />
                Produtos Mais Vendidos no Período
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {dados.top_itens.map((item, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-gold-500">#{i + 1} Mais Pedido</span>
                      <h4 className="font-bold text-white text-sm mt-1">{item.nome}</h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dark-border flex justify-between items-center text-xs">
                      <span className="text-gray-400">{item.quantidade} un.</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        R$ {item.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
