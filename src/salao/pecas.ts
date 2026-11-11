// Peças da cena, tudo em geometria (unidade: cm): frascos de esmalte de vidro
// com o líquido dentro, um celular com a tela viva e um pedestal.
import * as THREE from "three";
import { LARGURA, ALTURA } from "./telas";

// retângulo de cantos redondos centrado, para extrudar
function forma(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// caixa arredondada em pé (extrusão no eixo Y), base em y = 0
function blocoArredondado(w: number, prof: number, alt: number, r: number, bisel: number) {
  const geo = new THREE.ExtrudeGeometry(forma(w - bisel * 2, prof - bisel * 2, r), {
    depth: alt - bisel * 2,
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 5,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bisel, 0);
  geo.computeVertexNormals();
  return geo;
}

export type Frasco = { grupo: THREE.Group; liquido: THREE.MeshPhysicalMaterial };

export function criarFrasco(cor: number, escala = 1): Frasco {
  const grupo = new THREE.Group();
  const vidro = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 1.2,
    roughness: 0.04,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.2,
  });
  const liquido = new THREE.MeshPhysicalMaterial({
    color: cor,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    sheen: 0.3,
  });
  // corpo de vidro grosso, fundo mais pesado
  const corpo = new THREE.Mesh(blocoArredondado(3.8, 3.8, 4.4, 0.7, 0.35), vidro);
  corpo.castShadow = true;
  grupo.add(corpo);
  // o esmalte dentro (um pouco menor, começa acima do fundo grosso)
  const dentro = new THREE.Mesh(blocoArredondado(3.2, 3.2, 3.5, 0.5, 0.25), liquido);
  dentro.position.y = 0.45;
  grupo.add(dentro);
  // gargalo
  const gargalo = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.6, 32), vidro);
  gargalo.position.y = 4.6;
  grupo.add(gargalo);
  // tampa alta, laca preta
  const tampaMat = new THREE.MeshPhysicalMaterial({ color: 0x141012, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 3.6, 48, 1), tampaMat);
  tampa.position.y = 4.8 + 1.8;
  tampa.castShadow = true;
  grupo.add(tampa);
  const topoTampa = new THREE.Mesh(new THREE.SphereGeometry(0.95, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), tampaMat);
  topoTampa.scale.y = 0.18;
  topoTampa.position.y = 8.4;
  grupo.add(topoTampa);
  // anel dourado entre vidro e tampa
  const ouro = new THREE.MeshStandardMaterial({ color: 0xd9a77f, metalness: 1, roughness: 0.25 });
  const anel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 12, 48), ouro);
  anel.rotation.x = Math.PI / 2;
  anel.position.y = 4.85;
  grupo.add(anel);
  grupo.scale.setScalar(escala);
  return { grupo, liquido };
}

export type Celular = {
  grupo: THREE.Group;
  tela: THREE.CanvasTexture;
  canvasTela: HTMLCanvasElement;
};

const W = 7.4;
const H = 15.2;
const P = 0.78;

export function criarCelular(): Celular {
  const grupo = new THREE.Group();
  // moldura de alumínio rosé
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xe8c4b8, metalness: 1, roughness: 0.28, clearcoat: 0.6 });
  const corpo = new THREE.Mesh(
    new THREE.ExtrudeGeometry(forma(W - 0.24, H - 0.24, 1.05), {
      depth: P - 0.24,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 6,
      curveSegments: 16,
    }),
    metal
  );
  corpo.geometry.translate(0, 0, -(P - 0.24) / 2);
  corpo.castShadow = true;
  grupo.add(corpo);

  // vidro preto da frente
  const frente = new THREE.Mesh(
    new THREE.ShapeGeometry(forma(W - 0.12, H - 0.12, 1.0), 16),
    new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 })
  );
  frente.position.z = P / 2 + 0.005;
  grupo.add(frente);

  // tela: canvas como textura, sem tom de cena (cores fiéis ao sistema)
  const canvasTela = document.createElement("canvas");
  canvasTela.width = LARGURA;
  canvasTela.height = ALTURA;
  const tela = new THREE.CanvasTexture(canvasTela);
  tela.colorSpace = THREE.SRGBColorSpace;
  tela.anisotropy = 8;
  const tw = W - 0.5;
  const th = tw * (ALTURA / LARGURA);
  const geoTela = new THREE.ShapeGeometry(forma(tw, th, 0.8), 16);
  // ShapeGeometry usa a posição como UV: normalizar para 0..1
  const pos = geoTela.attributes.position;
  const uv = geoTela.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tw + 0.5, pos.getY(i) / th + 0.5);
  uv.needsUpdate = true;
  const telaMesh = new THREE.Mesh(geoTela, new THREE.MeshBasicMaterial({ map: tela, toneMapped: false }));
  telaMesh.position.z = P / 2 + 0.01;
  grupo.add(telaMesh);
  // reflexo do vidro por cima da tela
  const brilho = new THREE.Mesh(
    new THREE.ShapeGeometry(forma(W - 0.12, H - 0.12, 1.0), 16),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.02, metalness: 0, clearcoat: 1, depthWrite: false })
  );
  brilho.position.z = P / 2 + 0.02;
  grupo.add(brilho);

  // costas: módulo de câmeras
  const costas = new THREE.MeshPhysicalMaterial({ color: 0xf3d9d1, roughness: 0.45, metalness: 0.1, clearcoat: 0.4 });
  const tampaTras = new THREE.Mesh(new THREE.ShapeGeometry(forma(W - 0.12, H - 0.12, 1.0), 16), costas);
  tampaTras.position.z = -P / 2 - 0.005;
  tampaTras.rotation.y = Math.PI;
  grupo.add(tampaTras);
  const modulo = new THREE.Mesh(
    new THREE.ExtrudeGeometry(forma(2.9, 2.9, 0.7), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }),
    costas
  );
  modulo.position.set(W / 2 - 2.0, H / 2 - 2.0, -P / 2 - 0.15);
  grupo.add(modulo);
  const lenteMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b10, roughness: 0.05, clearcoat: 1, metalness: 0.5 });
  [[-0.6, 0.6], [-0.6, -0.6], [0.6, 0]].forEach(([dx, dy]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.22, 32), lenteMat);
    l.rotation.x = Math.PI / 2;
    l.position.set(W / 2 - 2.0 + dx, H / 2 - 2.0 + dy, -P / 2 - 0.27);
    grupo.add(l);
  });
  // botões laterais
  [[H / 2 - 3.2, 1.6], [H / 2 - 5.2, 1.0]].forEach(([y, alt]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, alt, 0.3), metal);
    b.position.set(W / 2 + 0.03, y, 0);
    grupo.add(b);
  });
  return { grupo, tela, canvasTela };
}

export const CELULAR = { W, H, P };

// pedestal de pedra clara onde tudo fica
export function criarPedestal() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xf1e7e2, roughness: 0.55 });
  const g = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.4, 1.6, 96), mat);
  disco.position.y = -0.8;
  disco.receiveShadow = true;
  g.add(disco);
  const friso = new THREE.Mesh(
    new THREE.TorusGeometry(14.05, 0.06, 8, 128),
    new THREE.MeshStandardMaterial({ color: 0xd9a77f, metalness: 1, roughness: 0.3 })
  );
  friso.rotation.x = Math.PI / 2;
  friso.position.y = -0.02;
  g.add(friso);
  return g;
}
