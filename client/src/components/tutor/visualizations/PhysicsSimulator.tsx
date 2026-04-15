import { useState } from "react";
import URMSimulator from "./URMSimulator";
import UCMSimulator from "./UCMSimulator";
import CentripetalSimulator from "./CentripetalSimulator";
import type { PhysicsSimulationType, SimulationParams } from "@/types";

interface PhysicsSimulatorProps {
  tipo: PhysicsSimulationType;
  parametros?: SimulationParams;
  onParamChange?: (params: SimulationParams) => void;
  className?: string;
}

export default function PhysicsSimulator({
  tipo,
  parametros = {},
  onParamChange,
  className = "",
}: PhysicsSimulatorProps) {
  const [activeParams, setActiveParams] =
    useState<SimulationParams>(parametros);

  const handleParamChange = (key: keyof SimulationParams, value: any) => {
    const newParams = { ...activeParams, [key]: value };
    setActiveParams(newParams);
    onParamChange?.(newParams);
  };

  const simulators = {
    urm: (
      <URMSimulator
        velocidadInicial={activeParams.velocidadInicial}
        posicionInicial={activeParams.posicionInicial}
        tiempoActual={activeParams.tiempoActual}
        mostrarVectores={activeParams.mostrarVectores}
        onTiempoChange={t => handleParamChange("tiempoActual", t)}
      />
    ),
    ucm: (
      <UCMSimulator
        radio={activeParams.radio}
        velocidadAngular={activeParams.velocidadAngular}
        periodo={activeParams.periodo}
        anguloActual={activeParams.anguloActual}
        mostrarVectores={activeParams.mostrarVectores}
        mostrarAngulo={true}
        onAnguloChange={a => handleParamChange("anguloActual", a)}
      />
    ),
    centripetal: (
      <CentripetalSimulator
        radio={activeParams.radio}
        masa={activeParams.masa}
        velocidadLineal={activeParams.velocidadLineal}
        mostrarVectores={activeParams.mostrarVectores}
        mostrarFuerza={activeParams.mostrarFuerza}
        mostrarRadio={true}
        onAnguloChange={a => handleParamChange("anguloActual", a)}
      />
    ),
  };

  return (
    <div className={`physics-simulator ${className}`}>{simulators[tipo]}</div>
  );
}
