import { useState, useRef } from 'react';
import { QrCode, Printer, Download, Copy, Check, X, ShieldCheck, Sparkles } from 'lucide-react';

export default function QrCodeModal({ isOpen, onClose, tenant }) {
  const [copiado, setCopiado] = useState(false);
  const printRef = useRef(null);

  if (!isOpen || !tenant) return null;

  // URL permanente que NUNCA muda (baseada no ID imutável do restaurante)
  const tenantId = tenant.id || 1;
  const qrPermanentUrl = `${window.location.origin}/cardapio/t/${tenantId}`;

  // Gerador de QR Code de alta resolução (400x400)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(qrPermanentUrl)}&margin=15&format=png`;

  const copiarLink = () => {
    navigator.clipboard.writeText(qrPermanentUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-mesa-${tenant.slug || 'restm'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 animate-fade-in backdrop-blur-md overflow-y-auto">
      {/* Estilos específicos para impressão da Placa de Mesa */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-card, #printable-qr-card * {
            visibility: visible !important;
          }
          #printable-qr-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 100mm !important;
            max-width: 100mm !important;
            border: 2px solid #D97706 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 16mm !important;
            border-radius: 8mm !important;
          }
          #printable-qr-card h2, #printable-qr-card p, #printable-qr-card span {
            color: black !important;
          }
        }
      `}</style>

      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative my-8">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl transition-colors"
          title="Fechar"
        >
          <X size={22} />
        </button>

        {/* Título do Modal */}
        <div className="mb-6 border-b border-dark-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gold-500/10 rounded-xl text-gold-500">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">QR Code para Mesas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Placa permanente de acesso ao cardápio digital</p>
            </div>
          </div>
        </div>

        {/* Alerta de Imutabilidade */}
        <div className="mb-6 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-emerald-300">
            <strong>QR Code 100% Permanente:</strong> Vinculado ao ID imutável da sua unidade (<strong>#{tenantId}</strong>).
            Você pode imprimir e fixar nas mesas agora mesmo — mesmo que altere o nome do restaurante no futuro, este código continuará funcionando para sempre!
          </div>
        </div>

        {/* --- PLACA DE MESA VISUAL (ÁREA IMPRIMÍVEL) --- */}
        <div
          id="printable-qr-card"
          ref={printRef}
          className="bg-white text-zinc-900 rounded-3xl p-6 border-2 border-amber-400 shadow-xl flex flex-col items-center text-center my-2"
        >
          {/* Logo / Nome do Restaurante */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-black tracking-tight text-zinc-900">
              Rest<span className="text-amber-500">M</span>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cardápio Digital</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 mb-1 max-w-xs leading-tight">
            {tenant.name || 'Restaurante'}
          </h3>

          <p className="text-zinc-500 text-xs mb-4">
            Aponte a câmera do seu celular para o QR Code abaixo
          </p>

          {/* Imagem do QR Code em Alta Resolução */}
          <div className="p-3 bg-white border border-zinc-200 rounded-2xl shadow-sm mb-4">
            <img
              src={qrImageUrl}
              alt={`QR Code ${tenant.name}`}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          </div>

          {/* Chamada para Ação */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl py-2 px-4 mb-2 max-w-xs">
            <p className="text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" />
              Consulte pratos, preços e fotos na sua mesa
            </p>
          </div>

          <span className="text-[10px] text-zinc-400 font-medium">
            Sem instalar aplicativos • Acesso instantâneo pelo navegador
          </span>
        </div>

        {/* Link Permanente */}
        <div className="mt-6 bg-dark-bg border border-dark-border rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="truncate text-gray-300 font-mono">
            {qrPermanentUrl}
          </div>
          <button
            onClick={copiarLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card hover:bg-gold-500 hover:text-black border border-dark-border rounded-lg text-white font-bold transition-all flex-shrink-0"
          >
            {copiado ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Botões de Ação do Modal */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-dark-bg hover:bg-zinc-800 border border-dark-border text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            <Download size={18} />
            <span>Baixar PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-extrabold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] text-sm"
          >
            <Printer size={18} />
            <span>Imprimir Placa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

