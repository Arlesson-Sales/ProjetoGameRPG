# 🎮 **Jogo 2D com JavaScript e Canvas** 🕹️

Este projeto é um jogo 2D desenvolvido com **JavaScript** e **Canvas HTML**, criado há 4 anos como parte dos meus estudos iniciais em programação. Embora não esteja perfeitamente documentado, ele demonstra conceitos interessantes de manipulação de sprites, colisões, câmera dinâmica e interações com NPCs (Personagens Não Jogáveis).

## 🚀 **Funcionalidades**

- **Renderização de cenas e sprites**:
  - Uso de tilesets para criar mapas e cenários.
  - Sprites animados para personagens e objetos.
- **Sistema de câmera dinâmica**:
  - A câmera segue o personagem principal e ajusta-se ao movimento.
- **Interações com NPCs**:
  - Diálogos com NPCs e lojas para compra e venda de itens.
- **Sistema de inventário**:
  - O jogador pode coletar e gerenciar itens.
- **Colisões e física simples**:
  - Detecção de colisão entre sprites e tiles.
- **Interface de diálogo e menus**:
  - Menus interativos para gerenciar status, inventário e lojas.

## 🛠️ **Tecnologias Utilizadas**

- **JavaScript**: Lógica do jogo, manipulação de sprites, colisões e interações.
- **Canvas HTML**: Renderização gráfica do jogo.
- **JSON**: Armazenamento de dados de cenas, NPCs e itens.

## 🕹️ **Como o Jogo Funciona**

O jogo é dividido em cenas, onde cada cena é um mapa composto por tiles (blocos gráficos). O jogador controla um personagem que pode interagir com NPCs, coletar itens e explorar o ambiente. A câmera segue o personagem, e as colisões são gerenciadas para evitar que o jogador atravesse objetos ou paredes.

### Principais Classes:
- **GameJS**: Classe principal que gerencia o loop do jogo, cenas, sprites e câmera.
- **Scene**: Representa uma cena do jogo, com tiles, sprites e colisões.
- **Sprite**: Classe base para todos os objetos renderizados (personagens, itens, etc.).
- **Character**: Herda de `Sprite` e adiciona comportamentos específicos para personagens.
- **Item**: Representa itens coletáveis, com atributos como nome, preço e bônus.
- **Camera**: Gerencia a visão do jogo, seguindo o personagem principal.
