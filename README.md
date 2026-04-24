# JF Logística Turística

Sistema de logística para transporte turístico: mapeia hotéis de uma cidade, permite atribuir hóspedes a cada hotel e calcula a rota ótima de coleta + retorno, sugerindo o veículo mais adequado da frota.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (tema escuro estilo Apple)
- Leaflet + OpenStreetMap (mapa)
- Overpass API (busca de hotéis, sem API key)
- Nominatim (geocoding de cidade/endereço, sem API key)
- OpenRouteService **ou** OSRM público (roteamento viário)
- OpenAI (sugestões opcionais de logística)
- Zustand + `persist` (estado + localStorage)
- Framer Motion (transições)

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção -> dist/
npm run typecheck
```

## Deploy na Vercel

1. Empurre o repo pro GitHub.
2. Vá em [vercel.com/new](https://vercel.com/new) e importe o repositório.
3. Framework preset: **Vite** (auto-detectado).
4. Build command: `npm run build`, Output: `dist`.
5. Deploy. Pronto.

Nenhuma variável de ambiente é necessária — chaves de API (OpenRouteService, OpenAI) são armazenadas **no dispositivo do usuário** (localStorage) via a tela de Configurações.

## Funcionalidades

- Busca de cidade (Nominatim) → plota hotéis automaticamente
- Busca por raio configurável (1–50 km) a partir do centro do mapa
- Adicionar hotéis manualmente (click no mapa)
- Atribuir hóspedes a cada hotel
- Cadastro de frota (capacidade dos veículos)
- **Rodar otimização**: algoritmo nearest-neighbor + roteamento viário real (OSRM/ORS)
- Rota de coleta (linha azul sólida) + retorno (linha verde tracejada)
- Sugestão automática do veículo mínimo que comporta os hóspedes
- **Rastreamento ao vivo**: GPS atualiza sua posição no mapa em tempo real (requer HTTPS)
- Sugestões contextualizadas via OpenAI (opcional)

## Geolocalização

- Em **localhost** o GPS do navegador funciona normalmente.
- Em rede (celular acessando por IP), exige **HTTPS**.
- No **desktop Linux** o GPS do navegador costuma falhar (sem provider). Use "Marcar no mapa", "Buscar endereço" ou teste no celular.

## Licença

MIT
