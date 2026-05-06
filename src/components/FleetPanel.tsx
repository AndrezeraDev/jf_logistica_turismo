import { useState } from 'react';
import { Plus, Trash2, Bus, Car, Fuel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { useStore } from '../store/useStore';
import { defaultConsumption } from '../lib/economy';
import type { Vehicle } from '../types';

const TYPES: Array<{ v: Vehicle['type']; label: string }> = [
  { v: 'carro', label: 'Carro' },
  { v: 'van', label: 'Van' },
  { v: 'micro-onibus', label: 'Micro-ônibus' },
  { v: 'onibus', label: 'Ônibus' },
  { v: 'outro', label: 'Outro' },
];

export function FleetPanel() {
  const vehicles = useStore((s) => s.vehicles);
  const addVehicle = useStore((s) => s.addVehicle);
  const updateVehicle = useStore((s) => s.updateVehicle);
  const removeVehicle = useStore((s) => s.removeVehicle);

  const [name, setName] = useState('');
  const [type, setType] = useState<Vehicle['type']>('van');
  const [capacity, setCapacity] = useState('15');
  const [consumption, setConsumption] = useState('');

  function submit() {
    const n = name.trim() || defaultName(type, parseInt(capacity, 10));
    const cap = parseInt(capacity, 10);
    if (!Number.isFinite(cap) || cap <= 0) return;
    const c = parseFloat(consumption.replace(',', '.'));
    addVehicle({
      name: n,
      type,
      capacity: cap,
      fuelConsumptionKmL: Number.isFinite(c) && c > 0 ? c : undefined,
    });
    setName('');
    setCapacity('15');
    setConsumption('');
    setType('van');
  }

  return (
    <Card title="Frota" subtitle={`${vehicles.length} veículo(s) cadastrado(s)`}>
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        <AnimatePresence initial={false}>
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-ink-300">
                {v.type === 'carro' ? <Car className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink-100 truncate">{v.name}</div>
                <div className="text-[11px] text-ink-400 flex items-center gap-2">
                  <span>
                    {v.type} • {v.capacity} lug.
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={v.fuelConsumptionKmL ?? ''}
                      placeholder={String(defaultConsumption(v.type))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(',', '.'));
                        updateVehicle(v.id, {
                          fuelConsumptionKmL:
                            Number.isFinite(val) && val > 0 ? val : undefined,
                        });
                      }}
                      className="w-12 bg-white/[0.04] border border-white/10 rounded px-1 text-[10px] text-ink-200 focus:outline-none focus:border-accent/60"
                      title={`km/L (default ${defaultConsumption(v.type)})`}
                    />
                    <span>km/L</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeVehicle(v.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-400 hover:bg-white/5"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
        <Input
          placeholder="Nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Vehicle['type'])}
            className="flex-1 h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-ink-100 focus:outline-none focus:border-accent/60"
          >
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-20 text-center"
            placeholder="lug."
          />
          <Input
            type="number"
            step="0.1"
            min={0.1}
            value={consumption}
            onChange={(e) => setConsumption(e.target.value)}
            className="w-20 text-center"
            placeholder={`${defaultConsumption(type)} km/L`}
            title="Consumo em km/L (opcional, usa default por tipo)"
          />
        </div>
        <Button onClick={submit} variant="secondary" size="sm" className="w-full">
          <Plus className="w-3.5 h-3.5" /> Adicionar veículo
        </Button>
      </div>
    </Card>
  );
}

function defaultName(t: Vehicle['type'], cap: number) {
  const map: Record<Vehicle['type'], string> = {
    carro: 'Carro',
    van: 'Van',
    'micro-onibus': 'Micro-ônibus',
    onibus: 'Ônibus',
    outro: 'Veículo',
  };
  return `${map[t]} ${cap} lugares`;
}
