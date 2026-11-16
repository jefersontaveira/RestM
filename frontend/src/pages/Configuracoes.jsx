import { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Palette,
  Upload,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Save,
  QrCode,
  MapPin,
  Phone,
  Search,
  Navigation,
  Sparkles,
  X,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import QrCodeModal from '../components/common/QrCodeModal';

const DIAS_SEMANA = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const CORES_SUGERIDAS = [
  { name: 'Dourado', hex: '#F59E0B' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Safira', hex: '#3B82F6' },
  { name: 'Rubi', hex: '#EF4444' },
  { name: 'Ametista', hex: '#8B5CF6' },
  { name: 'Laranja', hex: '#F97316' },
];

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Formatação automática de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
export const formatarTelefone = (valor) => {
  if (!valor) return '';
  const nums = valor.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
};

// Formatação automática de CEP: XXXXX-XXX
export const formatarCep = (valor) => {
  if (!valor) return '';
  const nums = valor.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
};

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Busca de CEP
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [statusCep, setStatusCep] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    primary_color: '#F59E0B',
    secondary_color: '#1E1E1E',
    operating_hours: {
      seg: { aberto: true, inicio: '11:00', fim: '23:00' },
      ter: { aberto: true, inicio: '11:00', fim: '23:00' },
      qua: { aberto: true, inicio: '11:00', fim: '23:00' },
      qui: { aberto: true, inicio: '11:00', fim: '23:00' },
      sex: { aberto: true, inicio: '11:00', fim: '23:59' },
      sab: { aberto: true, inicio: '11:00', fim: '23:59' },
      dom: { aberto: false, inicio: '11:00', fim: '22:00' },
    }
  });

  // Campos estruturados do endereço para garantir precisão no Google Maps
  const [enderecoCampos, setEnderecoCampos] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'CE'
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const res = await api.get('configuracoes/');
      const data = res.data;

      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        phone: formatarTelefone(data.phone || ''),
        primary_color: data.primary_color || '#F59E0B',
        secondary_color: data.secondary_color || '#1E1E1E',
        operating_hours: data.operating_hours || formData.operating_hours
      });

      // Carrega endereço estruturado se já existir
      if (data.address_details && typeof data.address_details === 'object' && Object.keys(data.address_details).length > 0) {
        setEnderecoCampos({
          cep: formatarCep(data.address_details.cep || ''),
          rua: data.address_details.rua || '',
          numero: data.address_details.numero || '',
          complemento: data.address_details.complemento || '',
          bairro: data.address_details.bairro || '',
          cidade: data.address_details.cidade || '',
          estado: data.address_details.estado || 'CE'
        });
      } else if (data.address) {
        // Tenta extrair rua e número se houver apenas string salva anteriormente
        const partes = data.address.split(',');
        const rua = partes[0] ? partes[0].trim() : '';
        const numero = partes[1] ? partes[1].trim().split(' ')[0] : '';
        setEnderecoCampos(prev => ({
          ...prev,
          rua: rua || data.address,
          numero: numero || ''
        }));
      }

      if (data.logo) {
        setLogoPreview(data.logo);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMensagemErro('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  // Monta a string completa de endereço formatada para o Google Maps
  const obterEnderecoCompleto = () => {
    const partes = [];
    if (enderecoCampos.rua) {
      let r = enderecoCampos.rua.trim();
      if (enderecoCampos.numero) r += `, ${enderecoCampos.numero.trim()}`;
      if (enderecoCampos.complemento) r += ` - ${enderecoCampos.complemento.trim()}`;
      partes.push(r);
    }
    if (enderecoCampos.bairro) partes.push(enderecoCampos.bairro.trim());
    if (enderecoCampos.cidade) {
      let loc = enderecoCampos.cidade.trim();
      if (enderecoCampos.estado) loc += ` - ${enderecoCampos.estado.trim().toUpperCase()}`;
      partes.push(loc);
    } else if (enderecoCampos.estado) {
      partes.push(enderecoCampos.estado.trim().toUpperCase());
    }
    if (enderecoCampos.cep) {
      partes.push(`CEP ${enderecoCampos.cep.trim()}`);
    }
    return partes.join(', ');
  };

  // Consulta automática no ViaCEP
  const buscarViaCep = async (cepParaBuscar) => {
    const cepLimpo = (cepParaBuscar || enderecoCampos.cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setStatusCep({ tipo: 'erro', texto: 'Digite os 8 dígitos do CEP.' });
      return;
    }

    try {
      setBuscandoCep(true);
      setStatusCep({ tipo: 'info', texto: 'Localizando CEP...' });
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dadosCep = await response.json();

      if (!dadosCep.erro) {
        setEnderecoCampos(prev => ({
          ...prev,
          rua: dadosCep.logradouro || prev.rua,
          bairro: dadosCep.bairro || prev.bairro,
          cidade: dadosCep.localidade || prev.cidade,
          estado: dadosCep.uf || prev.estado
        }));
        setStatusCep({ tipo: 'sucesso', texto: 'Endereço localizado com sucesso!' });
        setTimeout(() => setStatusCep({ tipo: '', texto: '' }), 3500);
      } else {
        setStatusCep({ tipo: 'erro', texto: 'CEP não encontrado. Preencha os dados manualmente.' });
      }
    } catch {
      setStatusCep({ tipo: 'erro', texto: 'Erro ao consultar o CEP. Preencha manualmente.' });
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e) => {
    const formatado = formatarCep(e.target.value);
    setEnderecoCampos(prev => ({ ...prev, cep: formatado }));
    const apenasDigitos = formatado.replace(/\D/g, '');
    if (apenasDigitos.length === 8) {
      buscarViaCep(apenasDigitos);
    }
  };

  const handleTelefoneChange = (e) => {
    const formatado = formatarTelefone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatado }));
  };

  const handleHorarioChange = (diaKey, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [diaKey]: {
          ...prev.operating_hours[diaKey],
          [campo]: valor
        }
      }
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const copiarLinkCardapio = () => {
    const url = `${window.location.origin}/cardapio/${formData.slug}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      const enderecoCompleto = obterEnderecoCompleto();

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('phone', formData.phone);
      formPayload.append('address', enderecoCompleto);
      formPayload.append('address_details', JSON.stringify(enderecoCampos));
      formPayload.append('primary_color', formData.primary_color);
      formPayload.append('secondary_color', formData.secondary_color);
      formPayload.append('operating_hours', JSON.stringify(formData.operating_hours));

      if (logoFile) {
        formPayload.append('logo', logoFile);
      }

      const res = await api.patch('configuracoes/', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.slug) {
        setFormData(prev => ({ ...prev, slug: res.data.slug }));
      }

      setMensagemSucesso('Configurações e endereço atualizados com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const errDetail = error.response?.data ? JSON.stringify(error.response.data) : 'Erro ao salvar alterações.';
      setMensagemErro(errDetail);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gold-500 mt-20 font-bold text-lg">Carregando configurações...</div>;
  }

  const linkCardapio = `${window.location.origin}/cardapio/${formData.slug || 'matriz'}`;
  const enderecoAtualFormatado = obterEnderecoCompleto();
  const mapsTestUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoAtualFormatado || 'Brasil')}`;

  return (
    <div className="w-full p-4 md:p-8 flex flex-col">
      {/* Modal de Impressão de QR Code */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tenant={{ id: 1, name: formData.name, slug: formData.slug }}
      />

      {/* Cabeçalho */}
      <header className="mb-8 border-b border-dark-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-500 flex items-center gap-3">
            <Settings size={32} />
            Configurações da Unidade
          </h1>
          <p className="text-gray-400 mt-1">Gerencie a identidade visual, localização no Maps, telefone WhatsApp e horários.</p>
        </div>

        {/* Link do Cardápio & Botão de Impressão de QR Code */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-black font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            title="Imprimir Placa de QR Code para mesas"
          >
            <QrCode size={18} />
            <span>Imprimir QR Code da Mesa</span>
          </button>

          <div className="flex items-center gap-2 bg-dark-card border border-dark-border px-3.5 py-2 rounded-xl">
            <div className="text-xs">
              <span className="text-gray-400 block text-[10px]">Link Web:</span>
              <span className="font-bold text-gold-500 truncate max-w-[160px] block">{linkCardapio}</span>
            </div>
            <button
              type="button"
              onClick={copiarLinkCardapio}
              title="Copiar Link"
              className="p-1.5 bg-dark-bg hover:bg-gold-500 hover:text-black rounded-lg transition-colors text-gray-300"
            >
              {copiado ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <a
              href={linkCardapio}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir Cardápio em nova aba"
              className="p-1.5 bg-dark-bg hover:bg-gold-500 hover:text-black rounded-lg transition-colors text-gray-300"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* --- NOTIFICAÇÃO FLUTUANTE NO CANTO INFERIOR DIREITO (ANEXO 1) --- */}
      {mensagemSucesso && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-auto z-50 animate-fade-in bg-zinc-900/95 border-2 border-emerald-500 text-white px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-3 backdrop-blur-md max-w-sm">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-extrabold text-sm text-emerald-400 leading-tight">Salvo com sucesso!</h4>
            <p className="text-xs text-gray-300 mt-0.5">{mensagemSucesso}</p>
          </div>
          <button
            type="button"
            onClick={() => setMensagemSucesso('')}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-auto z-50 animate-fade-in bg-zinc-900/95 border-2 border-red-500 text-white px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(239,68,68,0.35)] flex items-center gap-3 backdrop-blur-md max-w-sm">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-xl shrink-0">
            <AlertCircle size={22} />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-extrabold text-sm text-red-400 leading-tight">Erro ao salvar</h4>
            <p className="text-xs text-gray-300 mt-0.5">{mensagemErro}</p>
          </div>
          <button
            type="button"
            onClick={() => setMensagemErro('')}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-8 pb-12">

        {/* Seção 1: Identidade e WhatsApp */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-border pb-3">
            <Palette size={22} className="text-gold-500" />
            Identidade do Restaurante
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Ex: Restaurante da Esquina"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                O link do cardápio digital é gerado automaticamente a partir deste nome.
              </span>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>WhatsApp / Telefone de Contato</span>
                <span className="text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                  <Phone size={12} /> Formato Automático (85) 99999-9999
                </span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={handleTelefoneChange}
                maxLength={15}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors font-mono font-bold"
                placeholder="(85) 98131-1975"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                No cardápio público, ao clicar neste número os clientes são direcionados direto ao WhatsApp.
              </span>
            </div>
          </div>

          {/* Logotipo e Paleta de Cores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dark-border">
            {/* Upload do Logo */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Logotipo da Unidade
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={24} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-dark-bg hover:bg-zinc-800 text-white border border-dark-border px-4 py-2 rounded-xl text-sm font-semibold transition-colors inline-block mb-1">
                    Escolher Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">PNG, JPG ou WEBP. Tamanho recomendado: 500x500px.</p>
                </div>
              </div>
            </div>

            {/* Cores do Cardápio */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Cor Primária do Cardápio
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-28 bg-dark-bg border border-dark-border rounded-xl p-2.5 text-center text-sm font-mono text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Sugestões de Cores */}
              <div className="flex flex-wrap gap-2">
                {CORES_SUGERIDAS.map(cor => (
                  <button
                    key={cor.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, primary_color: cor.hex })}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-dark-bg border border-dark-border hover:border-white/30 text-gray-300 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor.hex }} />
                    {cor.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Endereço Completo com Localização no Google Maps */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-border pb-3 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={22} className="text-gold-500" />
              Endereço do Restaurante (Localização no Google Maps)
            </h2>
            <span className="text-xs text-gray-400">
              Campos completos para abrir a rota perfeita no Maps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* CEP com Busca Automática */}
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>CEP</span>
                {buscandoCep && <span className="text-gold-500 text-[10px] animate-pulse">Buscando...</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={enderecoCampos.cep}
                  onChange={handleCepChange}
                  maxLength={9}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-gold-500 transition-colors font-mono"
                  placeholder="62010-000"
                />
                <button
                  type="button"
                  onClick={() => buscarViaCep(enderecoCampos.cep)}
                  disabled={buscandoCep}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gold-500 rounded-lg transition-colors"
                  title="Buscar CEP automaticamente"
                >
                  <Search size={16} />
                </button>
              </div>
              {statusCep.texto && (
                <span className={`text-[11px] mt-1 block font-medium ${
                  statusCep.tipo === 'sucesso' ? 'text-emerald-400' : statusCep.tipo === 'info' ? 'text-gold-400' : 'text-amber-400'
                }`}>
                  {statusCep.texto}
                </span>
              )}
            </div>

            {/* Logradouro / Rua */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Rua / Avenida / Logradouro
              </label>
              <input
                type="text"
                value={enderecoCampos.rua}
                onChange={(e) => setEnderecoCampos({ ...enderecoCampos, rua: e.target.value })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Ex: Rua Bibiano Frota"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Número
              </label>
              <input
                type="text"
                value={enderecoCampos.numero}
                onChange={(e) => setEnderecoCampos({ ...enderecoCampos, numero: e.target.value })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors font-semibold"
                placeholder="Ex: 571"
              />
            </div>

            {/* Complemento / Referência */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Complemento (Opcional)
              </label>
              <input
                type="text"
                value={enderecoCampos.complemento}
                onChange={(e) => setEnderecoCampos({ ...enderecoCampos, complemento: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Ex: Loja 1, Em frente à praça"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={enderecoCampos.bairro}
                onChange={(e) => setEnderecoCampos({ ...enderecoCampos, bairro: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Ex: Centro"
              />
            </div>

            {/* Cidade & Estado */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={enderecoCampos.cidade}
                  onChange={(e) => setEnderecoCampos({ ...enderecoCampos, cidade: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Ex: Sobral"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                  UF
                </label>
                <select
                  value={enderecoCampos.estado}
                  onChange={(e) => setEnderecoCampos({ ...enderecoCampos, estado: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-gold-500 transition-colors font-bold"
                >
                  {ESTADOS_BRASIL.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pré-visualização do Endereço Completo & Botão de Teste no Google Maps */}
          <div className="mt-6 pt-5 border-t border-dark-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-bg/60 p-4 rounded-xl border border-dark-border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gold-500/10 text-gold-500 rounded-xl mt-0.5">
                <Navigation size={20} />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block">
                  Endereço Formatado para Clientes & Google Maps:
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {enderecoAtualFormatado || 'Preencha os campos de endereço acima.'}
                </p>
                <span className="text-xs text-gray-500 block mt-1">
                  Ao clicar no endereço do cardápio público, os clientes abrem este local com rota traçada no Maps.
                </span>
              </div>
            </div>

            {enderecoAtualFormatado && (
              <a
                href={mapsTestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500/15 hover:bg-gold-500 hover:text-black border border-gold-500/40 text-gold-500 text-xs font-bold transition-all shrink-0 self-start md:self-center group"
                title="Abrir no Google Maps para testar a localização"
              >
                <MapPin size={16} className="text-gold-500 group-hover:text-black" />
                <span>Testar no Google Maps</span>
                <ExternalLink size={14} className="opacity-70 group-hover:opacity-100" />
              </a>
            )}
          </div>
        </div>

        {/* Seção 3: Horários de Funcionamento */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Clock size={22} className="text-gold-500" />
            Horários de Funcionamento do Cardápio
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            O cardápio digital exibirá automaticamente a etiqueta de "Aberto Agora" ou "Fechado no Momento" com base nestes horários.
          </p>

          <div className="space-y-3">
            {DIAS_SEMANA.map((dia) => {
              const configDia = formData.operating_hours[dia.key] || { aberto: true, inicio: '11:00', fim: '23:00' };

              return (
                <div
                  key={dia.key}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors ${
                    configDia.aberto
                      ? 'bg-dark-bg border-dark-border'
                      : 'bg-dark-bg/40 border-dark-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-[180px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configDia.aberto}
                        onChange={(e) => handleHorarioChange(dia.key, 'aberto', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500" />
                    </label>

                    <span className="font-bold text-sm text-white">
                      {dia.label}
                    </span>
                  </div>

                  {configDia.aberto ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs text-gray-400">Abre:</span>
                        <input
                          type="time"
                          value={configDia.inicio}
                          onChange={(e) => handleHorarioChange(dia.key, 'inicio', e.target.value)}
                          className="bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>

                      <span className="text-gray-500 font-bold text-xs sm:text-sm">até</span>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs text-gray-400">Fecha:</span>
                        <input
                          type="time"
                          value={configDia.fim}
                          onChange={(e) => handleHorarioChange(dia.key, 'fim', e.target.value)}
                          className="bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500/80 bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20 self-start sm:self-auto">
                      Fechado o dia todo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão Salvar Fixo / Flutuante no Rodapé */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-8 py-3.5 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-black font-extrabold rounded-xl text-base shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all transform active:scale-95"
          >
            <Save size={20} />
            {salvando ? 'Salvando Alterações...' : 'Salvar Todas as Configurações'}
          </button>
        </div>

      </form>
    </div>
  );
}
