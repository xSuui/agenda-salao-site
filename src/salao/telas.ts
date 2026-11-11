// Telas do celular desenhadas em canvas, imitando o sistema real (rosa e
// pedra). Dados fictícios. Cantos arredondados com arcTo: roundRect só existe
// no Firefox 112+ (pegadinha da Trattoria).
export const LARGURA = 708;
export const ALTURA = 1500;

const ROSA = "#e11d48";
const ROSA_ESCURO = "#be123c";
const ROSA_CLARO = "#fff1f2";
const PEDRA_800 = "#292524";
const PEDRA_600 = "#57534e";
const PEDRA_400 = "#a8a29e";
const PEDRA_100 = "#f5f5f4";
const VERDE = "#16a34a";
const FONTE = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

type G = CanvasRenderingContext2D;

function caixa(g: G, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

function texto(g: G, t: string, x: number, y: number, tam: number, cor: string, peso = 500, alinhar: CanvasTextAlign = "left") {
  g.font = `${peso} ${tam}px ${FONTE}`;
  g.fillStyle = cor;
  g.textAlign = alinhar;
  g.textBaseline = "alphabetic";
  g.fillText(t, x, y);
}

// barra de status e cabeçalho do salão, comuns às telas da cliente
function topo(g: G, titulo: string, subtitulo: string) {
  g.fillStyle = "#fafaf9";
  g.fillRect(0, 0, LARGURA, ALTURA);
  texto(g, "9:41", 60, 62, 28, PEDRA_800, 600);
  caixa(g, LARGURA - 110, 42, 50, 24, 7);
  g.fillStyle = PEDRA_800;
  g.fill();
  // ilha da câmera
  caixa(g, LARGURA / 2 - 90, 28, 180, 50, 25);
  g.fillStyle = "#0c0a09";
  g.fill();
  texto(g, titulo, 56, 170, 46, PEDRA_800, 700);
  texto(g, subtitulo, 56, 214, 26, PEDRA_600, 400);
}

function botao(g: G, rotulo: string, y: number, cor = ROSA) {
  caixa(g, 56, y, LARGURA - 112, 96, 48);
  g.fillStyle = cor;
  g.fill();
  texto(g, rotulo, LARGURA / 2, y + 60, 32, "#fff", 600, "center");
}

function rodapeFicticio(g: G) {
  texto(g, "Dados fictícios de demonstração", LARGURA / 2, ALTURA - 50, 20, PEDRA_400, 400, "center");
}

// 0: vitrine do salão (abertura e fim)
function vitrine(g: G) {
  topo(g, "Studio Demo", "Unhas · Vila Mariana, São Paulo");
  // capa com degradê rosa
  const grad = g.createLinearGradient(0, 260, LARGURA, 640);
  grad.addColorStop(0, "#fecdd3");
  grad.addColorStop(1, "#fb7185");
  caixa(g, 56, 260, LARGURA - 112, 380, 36);
  g.fillStyle = grad;
  g.fill();
  // três frascos estilizados na capa
  [["#be123c", 200], ["#f9a8d4", 354], ["#d6b39a", 508]].forEach(([cor, x]) => {
    const cx = Number(x);
    caixa(g, cx - 40, 470, 80, 110, 16);
    g.fillStyle = String(cor);
    g.fill();
    caixa(g, cx - 18, 380, 36, 92, 8);
    g.fillStyle = "#1c1917";
    g.fill();
  });
  texto(g, "Serviços", 56, 720, 34, PEDRA_800, 700);
  const servicos = [
    ["Pé e mão", "60 min", "R$ 60"],
    ["Esmaltação em gel", "90 min", "R$ 90"],
    ["Alongamento", "120 min", "R$ 150"],
  ];
  servicos.forEach(([n, d, p], i) => {
    const y = 760 + i * 130;
    caixa(g, 56, y, LARGURA - 112, 110, 26);
    g.fillStyle = "#fff";
    g.fill();
    g.strokeStyle = "#e7e5e4";
    g.lineWidth = 2;
    g.stroke();
    texto(g, n, 92, y + 50, 30, PEDRA_800, 600);
    texto(g, d, 92, y + 86, 24, PEDRA_400, 400);
    texto(g, p, LARGURA - 92, y + 66, 30, ROSA_ESCURO, 700, "right");
  });
  botao(g, "Agendar horário", 1180);
  rodapeFicticio(g);
}

// 1: escolher serviço, dia e horário
function reserva(g: G) {
  topo(g, "Agendar", "Studio Demo");
  texto(g, "Serviço", 56, 300, 26, PEDRA_600, 600);
  caixa(g, 56, 320, LARGURA - 112, 110, 26);
  g.fillStyle = ROSA_CLARO;
  g.fill();
  g.strokeStyle = ROSA;
  g.lineWidth = 4;
  g.stroke();
  texto(g, "Esmaltação em gel", 92, 372, 30, PEDRA_800, 600);
  texto(g, "com Ana · 90 min", 92, 408, 24, PEDRA_600, 400);
  texto(g, "R$ 90", LARGURA - 92, 386, 30, ROSA_ESCURO, 700, "right");

  texto(g, "Dia", 56, 500, 26, PEDRA_600, 600);
  const dias = [["SEG", "17"], ["TER", "18"], ["QUA", "19"], ["QUI", "20"], ["SEX", "21"]];
  const largura = (LARGURA - 112 - 4 * 16) / 5;
  dias.forEach(([s, n], i) => {
    const x = 56 + i * (largura + 16);
    const sel = i === 2;
    caixa(g, x, 520, largura, 130, 24);
    g.fillStyle = sel ? ROSA : "#fff";
    g.fill();
    if (!sel) {
      g.strokeStyle = "#e7e5e4";
      g.lineWidth = 2;
      g.stroke();
    }
    texto(g, s, x + largura / 2, 568, 22, sel ? "#ffe4e6" : PEDRA_400, 600, "center");
    texto(g, n, x + largura / 2, 620, 40, sel ? "#fff" : PEDRA_800, 700, "center");
  });

  texto(g, "Horários livres", 56, 730, 26, PEDRA_600, 600);
  const horas = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30"];
  const lh = (LARGURA - 112 - 2 * 20) / 3;
  horas.forEach((h, i) => {
    const x = 56 + (i % 3) * (lh + 20);
    const y = 752 + Math.floor(i / 3) * 110;
    const sel = h === "14:30";
    const ocupado = h === "10:30";
    caixa(g, x, y, lh, 88, 22);
    g.fillStyle = sel ? ROSA : ocupado ? PEDRA_100 : "#fff";
    g.fill();
    if (!sel) {
      g.strokeStyle = "#e7e5e4";
      g.lineWidth = 2;
      g.stroke();
    }
    texto(g, h, x + lh / 2, y + 56, 30, sel ? "#fff" : ocupado ? PEDRA_400 : PEDRA_800, 600, "center");
    if (ocupado) {
      g.strokeStyle = PEDRA_400;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + lh / 2 - 44, y + 46);
      g.lineTo(x + lh / 2 + 44, y + 46);
      g.stroke();
    }
  });

  caixa(g, 56, 1010, LARGURA - 112, 120, 26);
  g.fillStyle = PEDRA_100;
  g.fill();
  texto(g, "Qua, 19 · 14:30 às 16:00", 92, 1062, 28, PEDRA_800, 600);
  texto(g, "Sinal de R$ 20 por Pix para confirmar", 92, 1100, 24, PEDRA_600, 400);
  botao(g, "Continuar", 1180);
  rodapeFicticio(g);
}

// QR code de mentira, mas com cara de QR (semente fixa)
function qr(g: G, x: number, y: number, tam: number) {
  const n = 29;
  const c = tam / n;
  let s = 7;
  const sorte = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = "#fff";
  g.fillRect(x - 24, y - 24, tam + 48, tam + 48);
  g.fillStyle = PEDRA_800;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const canto = (i < 8 && j < 8) || (i < 8 && j > n - 9) || (i > n - 9 && j < 8);
      if (!canto && sorte() > 0.52) g.fillRect(x + i * c, y + j * c, c + 0.5, c + 0.5);
    }
  const olho = (ox: number, oy: number) => {
    g.fillStyle = PEDRA_800;
    g.fillRect(ox, oy, 7 * c, 7 * c);
    g.fillStyle = "#fff";
    g.fillRect(ox + c, oy + c, 5 * c, 5 * c);
    g.fillStyle = PEDRA_800;
    g.fillRect(ox + 2 * c, oy + 2 * c, 3 * c, 3 * c);
  };
  olho(x, y);
  olho(x + (n - 7) * c, y);
  olho(x, y + (n - 7) * c);
}

// 2: sinal por Pix
function pix(g: G) {
  topo(g, "Sinal por Pix", "Esmaltação em gel · Qua, 19 · 14:30");
  caixa(g, 56, 270, LARGURA - 112, 640, 36);
  g.fillStyle = "#fff";
  g.fill();
  g.strokeStyle = "#e7e5e4";
  g.lineWidth = 2;
  g.stroke();
  texto(g, "R$ 20,00", LARGURA / 2, 350, 52, PEDRA_800, 700, "center");
  qr(g, LARGURA / 2 - 190, 400, 380);
  caixa(g, 56, 940, LARGURA - 112, 96, 48);
  g.strokeStyle = ROSA;
  g.lineWidth = 3;
  g.stroke();
  texto(g, "Copiar código Pix", LARGURA / 2, 1000, 30, ROSA_ESCURO, 600, "center");
  // selo de enviado
  caixa(g, 56, 1080, LARGURA - 112, 150, 30);
  g.fillStyle = "#f0fdf4";
  g.fill();
  g.beginPath();
  g.arc(130, 1155, 36, 0, Math.PI * 2);
  g.fillStyle = VERDE;
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 8;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(113, 1157);
  g.lineTo(126, 1170);
  g.lineTo(149, 1142);
  g.stroke();
  texto(g, "Pedido enviado ao salão", 190, 1146, 28, "#14532d", 700);
  texto(g, "Você recebe a confirmação no WhatsApp", 190, 1186, 23, "#166534", 400);
  rodapeFicticio(g);
}

// 3: painel ao vivo
function painel(g: G) {
  g.fillStyle = "#fafaf9";
  g.fillRect(0, 0, LARGURA, ALTURA);
  texto(g, "9:41", 60, 62, 28, PEDRA_800, 600);
  caixa(g, LARGURA / 2 - 90, 28, 180, 50, 25);
  g.fillStyle = "#0c0a09";
  g.fill();
  texto(g, "Painel", 56, 170, 46, PEDRA_800, 700);
  // selo ao vivo
  caixa(g, LARGURA - 220, 128, 164, 52, 26);
  g.fillStyle = "#dcfce7";
  g.fill();
  g.beginPath();
  g.arc(LARGURA - 190, 154, 9, 0, Math.PI * 2);
  g.fillStyle = VERDE;
  g.fill();
  texto(g, "ao vivo", LARGURA - 168, 164, 24, "#166534", 600);
  // filtros
  ["Hoje", "Semana", "Pendentes"].forEach((f, i) => {
    const x = 56 + i * 190;
    caixa(g, x, 220, 170, 64, 32);
    g.fillStyle = i === 0 ? PEDRA_800 : "#fff";
    g.fill();
    if (i) {
      g.strokeStyle = "#e7e5e4";
      g.lineWidth = 2;
      g.stroke();
    }
    texto(g, f, x + 85, 262, 24, i === 0 ? "#fff" : PEDRA_600, 600, "center");
  });
  const reservas = [
    ["14:30", "Carla M.", "Esmaltação em gel · Ana", "Nova", true],
    ["13:00", "Juliana R.", "Pé e mão · Bia", "Confirmada", false],
    ["10:30", "Patrícia S.", "Alongamento · Ana", "Atendida", false],
    ["09:00", "Renata L.", "Pé e mão · Bia", "Faltou", false],
  ] as const;
  reservas.forEach(([h, nome, serv, status, nova], i) => {
    const y = 320 + i * 220;
    caixa(g, 56, y, LARGURA - 112, 196, 28);
    g.fillStyle = "#fff";
    g.fill();
    g.strokeStyle = nova ? "#22c55e" : "#e7e5e4";
    g.lineWidth = nova ? 6 : 2;
    g.stroke();
    texto(g, h, 92, y + 70, 40, PEDRA_800, 700);
    texto(g, nome, 250, y + 66, 30, PEDRA_800, 600);
    texto(g, serv, 250, y + 106, 23, PEDRA_600, 400);
    const cores: Record<string, [string, string]> = {
      Nova: ["#dcfce7", "#166534"],
      Confirmada: [ROSA_CLARO, ROSA_ESCURO],
      Atendida: [PEDRA_100, PEDRA_600],
      Faltou: ["#fef3c7", "#92400e"],
    };
    const [fundo, cor] = cores[status];
    caixa(g, 250, y + 128, 170, 44, 22);
    g.fillStyle = fundo;
    g.fill();
    texto(g, status, 335, y + 158, 22, cor, 700, "center");
    if (nova) {
      texto(g, "agora", LARGURA - 92, y + 66, 22, VERDE, 600, "right");
    }
  });
  rodapeFicticio(g);
}

// 4: balanço
function balanco(g: G) {
  g.fillStyle = "#fafaf9";
  g.fillRect(0, 0, LARGURA, ALTURA);
  texto(g, "9:41", 60, 62, 28, PEDRA_800, 600);
  caixa(g, LARGURA / 2 - 90, 28, 180, 50, 25);
  g.fillStyle = "#0c0a09";
  g.fill();
  texto(g, "Balanço", 56, 170, 46, PEDRA_800, 700);
  texto(g, "Novembro", 56, 214, 26, PEDRA_600, 400);
  const kpis = [
    ["Ganhos", "R$ 3.480", "+12% vs out"],
    ["Atendimentos", "46", "+5"],
    ["Cancelamentos", "3", "-2"],
    ["Faltas", "1", "-3"],
  ];
  const lk = (LARGURA - 112 - 20) / 2;
  kpis.forEach(([r, v, d], i) => {
    const x = 56 + (i % 2) * (lk + 20);
    const y = 260 + Math.floor(i / 2) * 190;
    caixa(g, x, y, lk, 170, 26);
    g.fillStyle = "#fff";
    g.fill();
    g.strokeStyle = "#e7e5e4";
    g.lineWidth = 2;
    g.stroke();
    texto(g, r, x + 30, y + 50, 23, PEDRA_600, 500);
    texto(g, v, x + 30, y + 108, 44, PEDRA_800, 700);
    texto(g, d, x + 30, y + 146, 22, VERDE, 600);
  });
  // gráfico de barras: ganhos por semana
  caixa(g, 56, 660, LARGURA - 112, 560, 30);
  g.fillStyle = "#fff";
  g.fill();
  g.strokeStyle = "#e7e5e4";
  g.lineWidth = 2;
  g.stroke();
  texto(g, "Ganhos por dia", 92, 720, 26, PEDRA_800, 600);
  const valores = [0.35, 0.6, 0.45, 0.8, 1, 0.7, 0.25, 0.4, 0.65, 0.5, 0.9, 0.95];
  const base = 1150;
  const alto = 360;
  const n = valores.length;
  const lb = (LARGURA - 184 - (n - 1) * 12) / n;
  g.strokeStyle = "#f5f5f4";
  g.lineWidth = 2;
  for (let k = 0; k <= 3; k++) {
    const y = base - (alto * k) / 3;
    g.beginPath();
    g.moveTo(92, y);
    g.lineTo(LARGURA - 92, y);
    g.stroke();
  }
  valores.forEach((v, i) => {
    const x = 92 + i * (lb + 12);
    const h = v * alto;
    // ponta arredondada só em cima, presa na base
    const r = 8;
    g.beginPath();
    g.moveTo(x, base);
    g.lineTo(x, base - h + r);
    g.arcTo(x, base - h, x + r, base - h, r);
    g.lineTo(x + lb - r, base - h);
    g.arcTo(x + lb, base - h, x + lb, base - h + r, r);
    g.lineTo(x + lb, base);
    g.closePath();
    g.fillStyle = i === n - 1 ? ROSA : "#fda4af";
    g.fill();
  });
  texto(g, "Repasse Ana: R$ 1.120 · Bia: R$ 620", LARGURA / 2, 1290, 24, PEDRA_600, 500, "center");
  rodapeFicticio(g);
}

const DESENHOS = [vitrine, reserva, pix, painel, balanco];

// Cada tela vira um canvas pronto; a troca é só misturar dois deles
export function criarTelas(): HTMLCanvasElement[] {
  return DESENHOS.map((desenhar) => {
    const c = document.createElement("canvas");
    c.width = LARGURA;
    c.height = ALTURA;
    const g = c.getContext("2d")!;
    desenhar(g);
    return c;
  });
}
