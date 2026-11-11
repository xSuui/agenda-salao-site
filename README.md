# Agenda online para salões · página 3D

Página de apresentação do sistema de agendamento para salões de beleza
([demonstração do sistema](https://github.com/xSuui/agenda-salao-demo)).

A rolagem guia a câmera por um pedestal com frascos de esmalte de vidro e um
celular cuja tela mostra cada parte do sistema: página do salão, reserva,
sinal por Pix, painel ao vivo e balanço.

- **Tudo em código:** frascos (vidro com transmissão e o esmalte dentro), celular e telas
  desenhadas em canvas; nenhum modelo 3D ou vídeo baixado.
- **Troque a cor do esmalte** na abertura.
- **Funciona em qualquer aparelho:** versão completa, versão leve (sem sombras e
  sem transmissão) e, se o 3D não abrir, imagens das cenas que trocam com a rolagem.
- **Qualidade adaptativa:** abaixo de 40 fps, a resolução baixa sozinha.

Telas ilustrativas com dados fictícios.

## Rodar

```bash
npm install
npm run dev
```

Modo foto para conferir cada seção: `/?p=0` a `/?p=5`.

Stack: Next.js, React, TypeScript, Tailwind CSS, three.js.
Feito por [Samuel Rogério](https://srcs-portifolio.vercel.app).
