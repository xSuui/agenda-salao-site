"use client";

// Página de vendas do sistema de agendamento: canvas fixo atrás, seções na
// frente. A rolagem escolhe a câmera e a tela do celular.
import { useEffect, useRef, useState } from "react";
import { Motor } from "@/salao/motor";

// Tenta a versão completa; se o aparelho não aguentar, a leve; se nem assim,
// a página mostra imagens das cenas (plano B)
function criarMotor(canvas: HTMLCanvasElement, aoFicarPronto: () => void): Motor | null {
  for (const qualidade of ["completa", "leve"] as const) {
    try {
      return new Motor(canvas, { aoFicarPronto }, qualidade);
    } catch (e) {
      console.warn(`O 3D não abriu na qualidade ${qualidade}:`, e);
    }
  }
  return null;
}

const DEMO = "https://github.com/xSuui/agenda-salao-demo";
const CONTATO = "https://srcs-portifolio.vercel.app";

const CORES = [
  { nome: "Rosa", hex: "#f472b6" },
  { nome: "Nude", hex: "#d6a88f" },
  { nome: "Vermelho", hex: "#b3122f" },
  { nome: "Lilás", hex: "#a78bfa" },
  { nome: "Coral", hex: "#fb7185" },
];

const SECOES = [
  {
    id: "abertura",
    kicker: "Agenda online para salões",
    titulo: "Seu salão aberto para reservas, 24 horas.",
    texto: "A cliente escolhe o serviço, o dia e o horário sozinha. Você só confere o painel.",
  },
  {
    id: "reserva",
    kicker: "01 · Reserva em poucos toques",
    titulo: "Sem troca de mensagens.",
    texto: "Uma página com a cara do seu salão: serviços, preços e só os horários livres de cada profissional. Acabou o horário marcado duas vezes.",
  },
  {
    id: "pix",
    kicker: "02 · Sinal por Pix",
    titulo: "Menos faltas, sem constrangimento.",
    texto: "Ao reservar, a cliente paga um sinal por Pix. Você confere e confirma no painel. Quem paga o sinal costuma aparecer.",
  },
  {
    id: "painel",
    kicker: "03 · Painel ao vivo",
    titulo: "A reserva chega sozinha.",
    texto: "Cada reserva nova aparece na hora, com destaque. Marque como atendida, falta ou cancelada com um toque, e filtre por dia ou período.",
  },
  {
    id: "balanco",
    kicker: "04 · Balanço",
    titulo: "Saiba quanto o salão ganhou.",
    texto: "Ganhos, atendimentos, cancelamentos e faltas do mês, comparados com o mês anterior, e o repasse de cada profissional.",
  },
  {
    id: "fim",
    kicker: "Feito por Samuel Rogério",
    titulo: "Quer ver funcionando?",
    texto: "Serviços, profissionais e horários você mesma configura, sem precisar de ninguém. Veja a demonstração ou fale comigo.",
  },
];

export default function Experiencia() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motorRef = useRef<Motor | null>(null);
  const secoesRef = useRef<(HTMLElement | null)[]>([]);
  const fundosRef = useRef<(HTMLImageElement | null)[]>([]);
  const [pronto, setPronto] = useState(false);
  const [sem3d, setSem3d] = useState(false);
  const [modoFoto, setModoFoto] = useState(false);
  const [cor, setCor] = useState(CORES[0].hex);

  useEffect(() => {
    if (!canvasRef.current) return;
    const motor = criarMotor(canvasRef.current, () => setPronto(true));
    motorRef.current = motor;
    if (!motor) {
      setSem3d(true);
      setPronto(true);
    }

    const aoRolar = () => {
      const meio = window.scrollY + window.innerHeight / 2;
      const centros = secoesRef.current.map((s) => (s ? s.offsetTop + s.offsetHeight / 2 : 0));
      let p = 0;
      for (let i = 0; i < centros.length - 1; i++) {
        if (meio >= centros[i]) p = i + Math.min(1, (meio - centros[i]) / (centros[i + 1] - centros[i]));
      }
      motor?.setProgresso(p);
      fundosRef.current.forEach((img, i) => {
        if (img) img.style.opacity = String(Math.max(0, 1 - Math.abs(p - i)));
      });
      secoesRef.current.forEach((s, i) => {
        const bloco = s?.querySelector<HTMLElement>(".revelar");
        if (!bloco) return;
        const v = Math.max(0, 1 - Math.abs(p - i) * 1.6);
        bloco.style.opacity = String(v);
        bloco.style.transform = `translateY(${(1 - v) * 24}px)`;
      });
    };
    const foto = new URLSearchParams(window.location.search);
    if (motor && foto.has("p")) {
      // ?p=2 : modo foto, vai direto para a seção (prints e plano B)
      setPronto(true);
      setModoFoto(true);
      motor.foto(Number(foto.get("p")));
      return () => motor.destruir();
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      motor?.destruir();
    };
  }, []);

  useEffect(() => {
    motorRef.current?.setCor(cor);
  }, [cor]);

  return (
    <div className="pagina relative">
      <canvas ref={canvasRef} className="fixed inset-0 h-screen w-screen" />
      {sem3d && (
        <>
          <div className="fixed inset-0">
            {SECOES.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                ref={(el) => {
                  fundosRef.current[i] = el;
                }}
                src={`/fallback/cena-${i}.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity: i === 0 ? 1 : 0 }}
              />
            ))}
          </div>
          <p className="fixed right-4 bottom-4 z-20 max-w-xs rounded-lg bg-white/80 px-3 py-2 text-right text-xs text-stone-600 backdrop-blur">
            Versão em imagens: seu navegador não abriu o 3D. Para a experiência completa, ative a aceleração de hardware.
          </p>
        </>
      )}

      <div
        className={`fixed inset-0 z-30 flex items-center justify-center bg-[#f6eeea] transition-opacity duration-700 ${pronto ? "pointer-events-none opacity-0" : "opacity-100"} ${modoFoto ? "hidden" : ""}`}
      >
        <span className="font-mono text-xs tracking-[0.3em] text-stone-500">PREPARANDO O SALÃO…</span>
      </div>

      <main className={`relative z-10 ${modoFoto ? "hidden" : ""}`}>
        {SECOES.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            ref={(el) => {
              secoesRef.current[i] = el;
            }}
            className={`flex min-h-screen items-end px-5 pb-10 md:items-center md:px-16 md:pb-0 ${i % 2 ? "md:justify-end" : "md:justify-start"}`}
          >
            <div className="revelar caixa-texto sticky bottom-10 w-full max-w-sm md:top-1/3 md:bottom-auto">
              <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-rose-700 uppercase">{s.kicker}</p>
              <h2 className="mb-4 text-3xl font-semibold leading-tight text-stone-900 md:text-5xl">{s.titulo}</h2>
              <p className="text-base leading-relaxed text-stone-600">{s.texto}</p>

              {s.id === "abertura" && (
                <div className="mt-7">
                  <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-stone-500 uppercase">Troque a cor do esmalte</p>
                  <div className="flex gap-3">
                    {CORES.map((c) => (
                      <button
                        key={c.hex}
                        aria-label={c.nome}
                        title={c.nome}
                        onClick={() => setCor(c.hex)}
                        className={`h-9 w-9 rounded-full border-2 transition-transform ${cor === c.hex ? "scale-110 border-stone-900" : "border-white"}`}
                        style={{ background: c.hex, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {s.id === "fim" && (
                <>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a href={DEMO} target="_blank" rel="noopener" className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700">
                      Ver a demonstração
                    </a>
                    <a href={CONTATO} target="_blank" rel="noopener" className="rounded-full border border-stone-300 bg-white/70 px-6 py-3 text-sm font-semibold text-stone-800 backdrop-blur hover:bg-white">
                      Falar comigo
                    </a>
                  </div>
                  <p className="mt-6 text-xs text-stone-500">Telas ilustrativas com dados fictícios. Página 3D feita em Next.js e three.js.</p>
                </>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
