# HoloCraft Dashboard

Dashboard para visualizar e criar construções HoloCraft.

## Como executar

1. Certifique-se de que a API está rodando em `http://localhost:8000`.
2. Abra um servidor HTTP na pasta dashboard:
   ```
   cd dashboard
   python -m http.server 3000
   ```
3. Abra `http://localhost:3000` no navegador.

## Funcionalidades

- **Desenho**: Use o canvas para desenhar pixels com cores. Clique e arraste para pintar.
- **Enviar para Live**: Envia o desenho para a API live.
- **Construções Salvas**: Exibe as construções salvas como canvas 2D, atualizando automaticamente.