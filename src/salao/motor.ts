// Motor da cena: pedestal com frascos de esmalte e um celular cuja tela
// mostra o sistema. A rolagem escolhe a marcação de câmera e a tela.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { criarFrasco, criarCelular, criarPedestal, CELULAR, type Frasco, type Celular } from "./pecas";
import { criarTelas } from "./telas";

// az/el em graus; tam = quanto precisa caber na tela (cm); alvo = ponto olhado;
// lado = deslocamento na tela (cm, para a direita da câmera) quando há espaço
// para o texto ao lado; tela = qual tela do celular aparece
export type Marcacao = { az: number; el: number; tam: number; ax: number; ay: number; az2: number; lado: number; tela: number };

const meioCel = CELULAR.H / 2;
export const MARCACOES: Marcacao[] = [
  { az: -38, el: 12, tam: 18, ax: -5.5, ay: 5.8, az2: 3.5, lado: -6, tela: 0 }, // abertura: o frasco
  { az: -6, el: 4, tam: 19, ax: 0, ay: meioCel, az2: 0.5, lado: -6.5, tela: 1 }, // reserva
  { az: 22, el: 6, tam: 19, ax: 0, ay: meioCel, az2: 0.5, lado: 6.5, tela: 2 }, // pix
  { az: -16, el: 9, tam: 19, ax: 0, ay: meioCel, az2: 0.5, lado: -6.5, tela: 3 }, // painel
  { az: 14, el: 5, tam: 19, ax: 0, ay: meioCel, az2: 0.5, lado: 6.5, tela: 4 }, // balanço
  { az: 32, el: 18, tam: 33, ax: 0, ay: 6, az2: 0, lado: -4.5, tela: 0 }, // fim: tudo
];

export type Qualidade = "completa" | "leve";

const suave = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const misturar = (a: number, b: number, t: number) => a + (b - a) * t;

type Eventos = { aoFicarPronto?: () => void };

export class Motor {
  private renderer: THREE.WebGLRenderer;
  private cena = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  private raf = 0;
  private ultimo = performance.now();
  private tempo = 0;
  private progresso = 0;
  private atual: Marcacao = { ...MARCACOES[0] };
  private mouse = new THREE.Vector2();
  private mouseSuave = new THREE.Vector2();
  private fixo = false;

  private heroi: Frasco;
  private frascos: Frasco[] = [];
  private celular: Celular;
  private telas: HTMLCanvasElement[];
  private chaveTela = "";
  private corAlvo = new THREE.Color(0xf472b6);

  private pixelRatio: number;
  private quadros = 0;
  private janelaFps = 0;

  constructor(private canvas: HTMLCanvasElement, private eventos: Eventos = {}, private qualidade: Qualidade = "completa") {
    const leve = qualidade === "leve";
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    if (!this.renderer.getContext()) throw new Error("sem WebGL");
    this.pixelRatio = Math.min(window.devicePixelRatio, leve ? 1.25 : window.innerWidth < 768 ? 1.75 : 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !leve;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const fundo = new THREE.Color(0xf6eeea);
    this.cena.background = fundo;
    this.cena.fog = new THREE.Fog(fundo, 90, 220);

    // estúdio claro refletido no vidro e no metal
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    this.cena.environmentIntensity = 0.75;
    pmrem.dispose();

    // luz principal que faz a sombra macia no pedestal
    const sol = new THREE.DirectionalLight(0xfff4ee, 2.6);
    sol.position.set(-14, 26, 16);
    sol.castShadow = !leve;
    sol.shadow.mapSize.set(1024, 1024);
    const s = sol.shadow.camera;
    s.left = -18;
    s.right = 18;
    s.top = 18;
    s.bottom = -18;
    s.near = 5;
    s.far = 70;
    sol.shadow.radius = 4;
    sol.shadow.bias = -0.0005;
    this.cena.add(sol);
    this.cena.add(new THREE.HemisphereLight(0xffffff, 0xe9d5cf, 0.5));

    this.cena.add(criarPedestal());
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.12 }));
    chao.rotation.x = -Math.PI / 2;
    chao.position.y = -1.6;
    chao.receiveShadow = true;
    this.cena.add(chao);

    // celular em pé, levemente inclinado para trás
    this.celular = criarCelular();
    this.celular.grupo.position.set(0, meioCel + 0.05, 0);
    this.celular.grupo.rotation.x = -0.05;
    this.cena.add(this.celular.grupo);
    this.telas = criarTelas();

    // frascos: o rosa na frente (herói), nude e vermelho ao redor
    this.heroi = criarFrasco(0xf472b6, 1);
    this.heroi.grupo.position.set(-7.6, 0, 4.6);
    const nude = criarFrasco(0xd6a88f, 0.85);
    nude.grupo.position.set(6.8, 0, 3);
    nude.grupo.rotation.y = 0.5;
    const vermelho = criarFrasco(0xb3122f, 0.9);
    vermelho.grupo.position.set(-5.2, 0, -4.8);
    vermelho.grupo.rotation.y = -0.4;
    const lilas = criarFrasco(0xa78bfa, 0.7);
    lilas.grupo.position.set(5.6, 0, -4.2);
    lilas.grupo.rotation.y = 0.9;
    this.frascos = [this.heroi, nude, vermelho, lilas];
    this.frascos.forEach((f) => this.cena.add(f.grupo));

    // versão leve: vidro transparente simples no lugar da transmissão (pesada)
    if (leve) {
      this.cena.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
        if (m && "transmission" in m && m.transmission > 0) {
          m.transmission = 0;
          m.transparent = true;
          m.opacity = 0.28;
        }
      });
    }

    this.redimensionar();
    window.addEventListener("resize", this.redimensionar);
    window.addEventListener("pointermove", this.aoMover);
    this.atualizarTela(0, 0, 0);
    this.renderer.compileAsync(this.cena, this.camera).then(() => this.eventos.aoFicarPronto?.());
    this.raf = requestAnimationFrame(this.quadro);
  }

  // ---- API usada pela página ----
  setProgresso(p: number) {
    this.progresso = Math.min(MARCACOES.length - 1, Math.max(0, p));
  }
  setCor(cor: string) {
    this.corAlvo.set(cor);
  }
  foto(p: number) {
    this.setProgresso(p);
    this.atual = this.alvoDaMarcacao();
    this.heroi.liquido.color.copy(this.corAlvo);
    this.fixo = true;
  }
  destruir() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.redimensionar);
    window.removeEventListener("pointermove", this.aoMover);
    this.renderer.dispose();
  }

  private aoMover = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private redimensionar = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private alvoDaMarcacao(): Marcacao {
    const i = Math.min(MARCACOES.length - 2, Math.floor(this.progresso));
    const t = suave(this.progresso - i);
    const a = MARCACOES[i];
    const b = MARCACOES[i + 1];
    const r = {} as Marcacao;
    (Object.keys(a) as (keyof Marcacao)[]).forEach((k) => (r[k] = misturar(a[k], b[k], t)));
    return r;
  }

  // Mistura as duas telas da transição num canvas só (só redesenha se mudou)
  private atualizarTela(a: number, b: number, t: number) {
    const tq = Math.round(t * 40) / 40;
    const chave = `${a}-${b}-${tq}`;
    if (chave === this.chaveTela) return;
    this.chaveTela = chave;
    const g = this.celular.canvasTela.getContext("2d")!;
    g.globalAlpha = 1;
    g.drawImage(this.telas[a], 0, 0);
    if (a !== b && tq > 0) {
      g.globalAlpha = tq;
      g.drawImage(this.telas[b], 0, 0);
      g.globalAlpha = 1;
    }
    this.celular.tela.needsUpdate = true;
  }

  private quadro = (agora: number) => {
    this.raf = requestAnimationFrame(this.quadro);
    const dt = Math.min(0.05, (agora - this.ultimo) / 1000);
    this.ultimo = agora;
    this.tempo += dt;

    const k = this.fixo ? 1 : 1 - Math.exp(-dt * 4);
    const alvo = this.alvoDaMarcacao();
    (Object.keys(alvo) as (keyof Marcacao)[]).forEach((c) => {
      this.atual[c] = misturar(this.atual[c], alvo[c], k);
    });
    this.mouseSuave.lerp(this.mouse, 1 - Math.exp(-dt * 3));

    // tela: a troca acontece no meio do caminho entre duas seções
    const i = Math.min(MARCACOES.length - 2, Math.floor(this.progresso));
    const f = this.progresso - i;
    this.atualizarTela(MARCACOES[i].tela, MARCACOES[i + 1].tela, suave((f - 0.3) / 0.4));

    // vida: o frasco herói gira devagar, o celular flutua um tico
    const T = this.fixo ? 0 : this.tempo;
    this.heroi.grupo.rotation.y = -0.5 + Math.sin(T * 0.4) * 0.35;
    this.heroi.liquido.color.lerp(this.corAlvo, this.fixo ? 1 : 1 - Math.exp(-dt * 5));
    this.celular.grupo.position.y = meioCel + 0.05 + Math.sin(T * 0.9) * 0.12;
    this.celular.grupo.rotation.y = Math.sin(T * 0.5) * 0.03;

    this.posicionarCamera();
    this.renderer.render(this.cena, this.camera);
    this.medirFps(dt);
  };

  // Enquadra por tamanho; no celular em pé o deslocamento lateral some (o texto
  // vai por cima, embaixo)
  private posicionarCamera() {
    const { az, el, tam, ax, ay, az2, lado } = this.atual;
    const aspecto = this.camera.aspect;
    const meiaFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const dist = tam / 2 / (Math.tan(meiaFov) * Math.min(1, aspecto));
    const a = THREE.MathUtils.degToRad(az + this.mouseSuave.x * 4);
    const b = THREE.MathUtils.degToRad(el - this.mouseSuave.y * 2.5);
    const alvo = new THREE.Vector3(ax, ay, az2);
    const pos = new THREE.Vector3(
      ax + Math.sin(a) * Math.cos(b) * dist,
      ay + Math.sin(b) * dist,
      az2 + Math.cos(a) * Math.cos(b) * dist
    );
    // empurra o objeto para o lado oposto ao texto, em tela larga
    const espaco = Math.min(1, Math.max(0, (aspecto - 0.9) / 0.5));
    const direita = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const desloc = direita.multiplyScalar(lado * espaco * (tam / 19));
    alvo.add(desloc);
    pos.add(desloc);
    // no celular em pé, o objeto sobe um pouco para o texto caber embaixo
    if (aspecto < 0.9) {
      alvo.y -= tam * 0.25;
      pos.y -= tam * 0.25;
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(alvo);
  }

  // Qualidade adaptativa: abaixo de 40 fps, baixa a resolução
  private medirFps(dt: number) {
    this.quadros++;
    this.janelaFps += dt;
    if (this.janelaFps >= 2) {
      const fps = this.quadros / this.janelaFps;
      if (fps < 40 && this.pixelRatio > 1) {
        this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.redimensionar();
      }
      this.quadros = 0;
      this.janelaFps = 0;
    }
  }
}
