import type { Route, Vehicle } from '../types';

export async function suggestWithAI(
  apiKey: string,
  model: string,
  route: Route,
  vehicles: Vehicle[],
): Promise<string> {
  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Você é um planejador de logística turística. Seja curto, objetivo e em português. Responda em no máximo 6 linhas.',
      },
      {
        role: 'user',
        content:
          `Tenho ${route.totalGuests} hóspedes em ${route.stops.length} hotéis. ` +
          `Distância total estimada: ${route.totalDistanceKm.toFixed(1)} km, ` +
          `duração ${route.totalDurationMin.toFixed(0)} min.\n` +
          `Ordem de coleta: ${route.stops
            .map((s) => `${s.order}. ${s.name} (${s.guests} pax)`)
            .join(' → ')}\n` +
          `Frota disponível:\n${vehicles
            .map((v) => `- ${v.name} [${v.type}, capacidade ${v.capacity}]`)
            .join('\n')}\n\n` +
          `Recomende o veículo mais adequado (ou combinação) e dê 2 dicas de execução (ordem, janelas de tempo, conforto).`,
      },
    ],
    temperature: 0.4,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
