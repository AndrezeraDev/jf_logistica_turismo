import type { Route, Vehicle } from '../types';

interface ShareCtx {
  route: Route;
  originLabel?: string;
  destinationLabel?: string;
  vehicle?: Vehicle;
  date?: Date;
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);

/**
 * Texto formatado pra WhatsApp / email.
 * Inclui ordem de coleta + drop-off (se houver) + totais.
 */
export function buildShareText(ctx: ShareCtx): string {
  const { route, originLabel, destinationLabel, vehicle, date = new Date() } = ctx;
  const lines: string[] = [];
  lines.push('🚌 *ROTEIRO — JE Hoffmann Turismo*');
  lines.push(`📅 ${fmtDate(date)}`);
  lines.push('');

  if (originLabel) lines.push(`📍 *Saída:* ${originLabel}`);
  if (destinationLabel) lines.push(`🏁 *Destino:* ${destinationLabel}`);
  lines.push('');

  lines.push(`▶️ *COLETA* — ${route.stops.length} parada(s), ${route.totalGuests} pax:`);
  lines.push('');
  route.stops.forEach((s) => {
    lines.push(`*${s.order}.* ${s.name}`);
    lines.push(`   👥 ${s.guests} pax`);
  });

  if (route.returnStops.length > 0) {
    lines.push('');
    lines.push(`◀️ *RETORNO* — drop-off:`);
    lines.push('');
    route.returnStops.forEach((s) => {
      lines.push(`*${s.order}.* ${s.name}`);
      lines.push(`   👥 ${s.guests} pax`);
    });
  }

  lines.push('');
  lines.push('────────────────');
  lines.push(`📊 ${route.totalDistanceKm.toFixed(1)} km · ${Math.round(route.totalDurationMin)} min`);
  if (route.trafficDelayMin && route.trafficDelayMin > 0.5) {
    lines.push(`🚦 +${Math.round(route.trafficDelayMin)} min por trânsito`);
  }
  if (vehicle) {
    lines.push(`🚐 ${vehicle.name} (${vehicle.capacity} lugares)`);
  }
  return lines.join('\n');
}

/**
 * Deep link do Google Maps com todos os waypoints na ordem.
 * Abre direto no app do Google Maps no celular ou web no desktop.
 */
export function buildGoogleMapsUrl(ctx: ShareCtx): string {
  const { route } = ctx;
  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('travelmode', 'driving');
  params.set('origin', `${route.origin.lat},${route.origin.lng}`);

  // Pickup waypoints (todos os hotéis em ordem)
  const pickupWp = route.stops.map((s) => `${s.lat},${s.lng}`);

  // Destination final: se houver returnStops, é a origem; senão, último ponto que entrar
  // (o último hotel da coleta — o app sem destino usa return; com destino, o destino é fim)
  let dest: string;
  let waypoints: string[];
  if (route.returnStops.length > 0) {
    // Modo round-trip: vai até último pickup, depois volta passando pelos returnStops, termina origin
    waypoints = [...pickupWp, ...route.returnStops.map((s) => `${s.lat},${s.lng}`)];
    dest = `${route.origin.lat},${route.origin.lng}`;
  } else if (pickupWp.length > 0) {
    // Modo one-way: último pickup vira destination, demais ficam waypoints
    waypoints = pickupWp.slice(0, -1);
    dest = pickupWp[pickupWp.length - 1];
  } else {
    waypoints = [];
    dest = `${route.origin.lat},${route.origin.lng}`;
  }
  params.set('destination', dest);
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Imprime numa janela nova com layout limpo. Usuário usa "Salvar como PDF"
 * no diálogo de impressão do navegador.
 */
export function printRoute(ctx: ShareCtx): void {
  const { route, originLabel, destinationLabel, vehicle, date = new Date() } = ctx;
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) return;

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
      color: #1d1d1f;
      background: white;
      padding: 32px 40px;
      line-height: 1.4;
    }
    .header {
      display: flex; align-items: center; gap: 16px;
      padding-bottom: 18px;
      border-bottom: 2px solid #0A84FF;
      margin-bottom: 24px;
    }
    .header img { width: 64px; height: 64px; border-radius: 50%; }
    .header-text h1 {
      font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
    }
    .header-text .subtitle {
      font-size: 12px; color: #6e6e73; margin-top: 2px;
    }
    .meta {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin-bottom: 24px;
    }
    .meta-item {
      padding: 12px 14px;
      background: #f5f5f7; border-radius: 12px;
    }
    .meta-item .label {
      font-size: 10px; text-transform: uppercase; color: #6e6e73;
      letter-spacing: 0.06em; font-weight: 600;
    }
    .meta-item .value {
      font-size: 18px; font-weight: 700; color: #1d1d1f; margin-top: 2px;
    }
    .pin-row {
      display: flex; gap: 12px; margin-bottom: 18px; align-items: center;
      padding: 10px 14px; border-radius: 10px;
      background: #f5f5f7;
    }
    .pin-row .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
    .pin-row .dot.start { background: white; border: 3px solid #0A84FF; }
    .pin-row .dot.end { background: white; border: 3px solid #FF3B30; }
    .pin-row .info { flex: 1; }
    .pin-row .info .label { font-size: 10px; color: #6e6e73; text-transform: uppercase; }
    .pin-row .info .text { font-size: 14px; font-weight: 600; }
    section h2 {
      font-size: 14px; text-transform: uppercase;
      letter-spacing: 0.08em; color: #0A84FF;
      margin: 24px 0 10px;
    }
    .stop {
      display: flex; gap: 14px; padding: 12px 0;
      border-bottom: 1px solid #e5e5ea;
    }
    .stop:last-child { border: none; }
    .stop .num {
      width: 32px; height: 32px; border-radius: 50%;
      background: #0A84FF; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .stop.return .num { background: #34C759; }
    .stop .body { flex: 1; }
    .stop .body .name { font-size: 15px; font-weight: 600; }
    .stop .body .pax { font-size: 12px; color: #6e6e73; margin-top: 2px; }
    .footer {
      margin-top: 32px; padding-top: 16px;
      border-top: 1px solid #e5e5ea;
      font-size: 11px; color: #86868b; text-align: center;
    }
    @media print {
      body { padding: 16px 24px; }
      .stop, .pin-row, .meta-item { break-inside: avoid; }
    }
  `;

  const stopsHtml = route.stops
    .map(
      (s) => `
      <div class="stop">
        <div class="num">${s.order}</div>
        <div class="body">
          <div class="name">${escapeHtml(s.name)}</div>
          <div class="pax">${s.guests} hóspede(s)</div>
        </div>
      </div>`,
    )
    .join('');

  const returnHtml =
    route.returnStops.length > 0
      ? `<section><h2>Retorno (drop-off)</h2>${route.returnStops
          .map(
            (s) => `
        <div class="stop return">
          <div class="num">${s.order}</div>
          <div class="body">
            <div class="name">${escapeHtml(s.name)}</div>
            <div class="pax">${s.guests} hóspede(s)</div>
          </div>
        </div>`,
          )
          .join('')}</section>`
      : '';

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8" />
    <title>Roteiro — JE Hoffmann Turismo</title>
    <style>${css}</style>
  </head><body>
    <div class="header">
      <img src="${window.location.origin}/logo.png" alt="JE Hoffmann" />
      <div class="header-text">
        <h1>Roteiro de Coleta</h1>
        <div class="subtitle">JE Hoffmann Turismo · ${escapeHtml(fmtDate(date))}</div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <div class="label">Distância</div>
        <div class="value">${route.totalDistanceKm.toFixed(1)} km</div>
      </div>
      <div class="meta-item">
        <div class="label">Duração</div>
        <div class="value">${Math.round(route.totalDurationMin)} min</div>
      </div>
      <div class="meta-item">
        <div class="label">Passageiros</div>
        <div class="value">${route.totalGuests}</div>
      </div>
    </div>

    ${
      originLabel
        ? `<div class="pin-row"><div class="dot start"></div><div class="info">
            <div class="label">Saída</div>
            <div class="text">${escapeHtml(originLabel)}</div>
          </div></div>`
        : ''
    }
    ${
      destinationLabel
        ? `<div class="pin-row"><div class="dot end"></div><div class="info">
            <div class="label">Destino final</div>
            <div class="text">${escapeHtml(destinationLabel)}</div>
          </div></div>`
        : ''
    }

    <section>
      <h2>Coleta — ${route.stops.length} parada(s) · ${route.totalGuests} pax</h2>
      ${stopsHtml}
    </section>

    ${returnHtml}

    ${
      vehicle
        ? `<section><h2>Veículo sugerido</h2>
        <div style="font-size:14px; padding:8px 0;">
          ${escapeHtml(vehicle.name)} — ${vehicle.capacity} lugares
        </div></section>`
        : ''
    }

    <div class="footer">
      JE Hoffmann Turismo · Roteiro gerado em ${escapeHtml(fmtDate(date))}
    </div>

    <script>
      window.onload = () => setTimeout(() => window.print(), 250);
    </script>
  </body></html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  );
}
