# Multiplayer Soccer - Apresentação

Página de apresentação React para o projeto Multiplayer Soccer.

## Instalação

```bash
cd presentation
npm install
```

## Executar Localmente

```bash
npm start
```

Abre em [http://localhost:3000](http://localhost:3000)

## Build para Produção

```bash
npm run build
```

Cria a build otimizada na pasta `build/`.

## Estrutura

- `/src/App.js` - Componente principal com todo o conteúdo da apresentação
- `/src/App.css` - Estilos completos da página
- `/src/index.js` - Ponto de entrada React
- `/src/index.css` - Estilos globais

## Recursos

- ✅ Animações de scroll suaves
- ✅ Design responsivo
- ✅ Seções bem organizadas
- ✅ Placeholders para screenshots do jogo
- ✅ Todas as informações visíveis (sem hover/click)

## Adicionar Screenshots

Os placeholders estão marcados com a classe `.screenshot-placeholder`. 
Substitua esses elementos por suas imagens reais:

```javascript
<img src="/caminho/para/sua/imagem.png" alt="Descrição" />
```

Locais para screenshots:
1. Hero Section - Screenshot principal do jogo
2. Performance Section - Gameplay em tempo real
3. Conclusion Section - Ranking e estatísticas
