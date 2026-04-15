import { AIResponse } from "@/types";

const OLLAMA_API_URL = "https://ollama.com/api";

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface OllamaToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

const TUTOR_TOOLS: OllamaToolDefinition[] = [
  // FÍSICA
  {
    type: "function",
    function: {
      name: "create_simulation",
      description:
        "Crea una simulación física interactiva. Usa esto cuando el estudiante pregunte sobre MRU, MCU, fuerza centrípeta, o cualquier concepto de cinemática o dinámica.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["urm", "ucm", "centripetal"],
            description:
              "Tipo de simulación: 'urm' (Movimiento Rectilíneo Uniforme), 'ucm' (Movimiento Circular Uniforme), 'centripetal' (Fuerza Centrípeta)",
          },
          params: {
            type: "object",
            properties: {
              velocidadInicial: {
                type: "number",
                description: "Velocidad inicial en m/s",
              },
              posicionInicial: {
                type: "number",
                description: "Posición inicial en metros",
              },
              radio: {
                type: "number",
                description: "Radio de la trayectoria circular",
              },
              periodo: {
                type: "number",
                description: "Período de rotación en segundos",
              },
              masa: { type: "number", description: "Masa del objeto en kg" },
              velocidadLineal: {
                type: "number",
                description: "Velocidad tangencial en m/s",
              },
            },
          },
          titulo: { type: "string", description: "Título de la simulación" },
        },
        required: ["type", "params"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_wave_diagram",
      description:
        "Crea un diagrama de ondas. Úsalo para explicar ondas, sonido, luz, longitud de onda, frecuencia.",
      parameters: {
        type: "object",
        properties: {
          amplitud: { type: "number", description: "Amplitud de la onda" },
          longitudOnda: {
            type: "number",
            description: "Longitud de onda (lambda)",
          },
          frecuencia: { type: "number", description: "Frecuencia en Hz" },
          tipo: {
            type: "string",
            enum: ["transversal", "longitudinal"],
            description: "Tipo de onda",
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["titulo"],
      },
    },
  },

  // MATEMÁTICAS
  {
    type: "function",
    function: {
      name: "create_function_graph",
      description:
        "Crea un gráfico de función matemática. Úsalo para representar funciones lineales, cuadráticas, trigonométricas, etc.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "lineal",
              "cuadratica",
              "cubica",
              "trigonometrica",
              "exponencial",
              "logaritmica",
              "rational",
            ],
            description: "Tipo de función",
          },
          funcion: {
            type: "string",
            description:
              "Función en notación matemática. Ej: 'x^2', 'sin(x)', '2*x+1'",
          },
          rangoMinX: {
            type: "number",
            description: "Valor mínimo del eje X",
            default: -10,
          },
          rangoMaxX: {
            type: "number",
            description: "Valor máximo del eje X",
            default: 10,
          },
          titulo: { type: "string", description: "Título del gráfico" },
        },
        required: ["tipo", "titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_trig_circle",
      description:
        "Crea una circunferencia goniométrica. Úsalo para explicar razones trigonométricas, ángulos notables, identidades.",
      parameters: {
        type: "object",
        properties: {
          angulo: { type: "number", description: "Ángulo en grados" },
          mostrarSeno: {
            type: "boolean",
            description: "Mostrar línea del seno",
            default: true,
          },
          mostrarCoseno: {
            type: "boolean",
            description: "Mostrar línea del coseno",
            default: true,
          },
          mostrarTangente: {
            type: "boolean",
            description: "Mostrar línea de la tangente",
            default: false,
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["angulo", "titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_geometry_shape",
      description:
        "Crea una figura geométrica. Úsalo para explicar áreas, perímetros, volúmenes, geometría analítica.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "triangulo",
              "cuadrado",
              "rectangulo",
              "circulo",
              "poligono",
              "trapecio",
              "paralelogramo",
            ],
            description: "Tipo de figura",
          },
          dimensiones: {
            type: "object",
            properties: {
              lado1: { type: "number", description: "Lado 1 o base" },
              lado2: { type: "number", description: "Lado 2 o altura" },
              radio: { type: "number", description: "Radio (para círculo)" },
              numLados: {
                type: "number",
                description: "Número de lados (para polígono)",
              },
            },
          },
          mostrarArea: {
            type: "boolean",
            description: "Mostrar cálculo del área",
            default: true,
          },
          mostrarPerimetro: {
            type: "boolean",
            description: "Mostrar cálculo del perímetro",
            default: true,
          },
          titulo: { type: "string", description: "Título de la figura" },
        },
        required: ["tipo", "titulo"],
      },
    },
  },

  // QUÍMICA
  {
    type: "function",
    function: {
      name: "create_molecule",
      description:
        "Crea un diagrama de molécula. Úsalo para explicar enlaces, estructuras de Lewis, geometría molecular.",
      parameters: {
        type: "object",
        properties: {
          formula: {
            type: "string",
            description: "Fórmula química. Ej: 'H2O', 'CO2', 'CH4'",
          },
          nombre: { type: "string", description: "Nombre de la molécula" },
          tipo: {
            type: "string",
            enum: ["lewis", "ball-stick", "espacial"],
            description: "Tipo de representación",
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["formula", "titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_periodic_element",
      description:
        "Muestra información de un elemento de la tabla periódica. Úsalo para explicar propiedades, configuración electrónica, grupos.",
      parameters: {
        type: "object",
        properties: {
          simbolo: {
            type: "string",
            description: "Símbolo del elemento. Ej: 'H', 'C', 'O', 'Na'",
          },
          mostrarConfiguracion: {
            type: "boolean",
            description: "Mostrar configuración electrónica",
            default: true,
          },
          mostrarPropiedades: {
            type: "boolean",
            description: "Mostrar propiedades físicas",
            default: true,
          },
          titulo: { type: "string", description: "Título" },
        },
        required: ["simbolo", "titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reaction_scheme",
      description:
        "Crea un esquema de reacción química. Úsalo para explicar reacciones, equilibrio, estequiometría.",
      parameters: {
        type: "object",
        properties: {
          reactivos: {
            type: "string",
            description: "Reactivos. Ej: '2H2 + O2'",
          },
          productos: { type: "string", description: "Productos. Ej: '2H2O'" },
          tipo: {
            type: "string",
            enum: ["sintesis", "descomposicion", "sustitucion", "combustion"],
            description: "Tipo de reacción",
          },
          condiciones: {
            type: "string",
            description: "Condiciones (temperatura, catalizador, etc.)",
          },
          titulo: { type: "string", description: "Título de la reacción" },
        },
        required: ["reactivos", "productos", "titulo"],
      },
    },
  },

  // BIOLOGÍA
  {
    type: "function",
    function: {
      name: "create_cell_diagram",
      description:
        "Crea un diagrama de célula. Úsalo para explicar orgánulos, diferencias animal/vegetal, mitosis.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["animal", "vegetal"],
            description: "Tipo de célula",
          },
          orgánulosActivos: {
            type: "array",
            items: { type: "string" },
            description: "Orgánulos a destacar. Ej: ['núcleo', 'mitocondrias']",
          },
          mostrarFunciones: {
            type: "boolean",
            description: "Mostrar funciones de cada orgánulo",
            default: true,
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["tipo", "titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_dna_diagram",
      description:
        "Crea un diagrama de ADN. Úsalo para explicar replicación, transcripción, genética molecular.",
      parameters: {
        type: "object",
        properties: {
          segmentos: {
            type: "number",
            description: "Número de pares de bases a mostrar",
            default: 6,
          },
          mostrarBasePairs: {
            type: "boolean",
            description: "Mostrar pares de bases (A-T, G-C)",
            default: true,
          },
          mostrarGenes: {
            type: "boolean",
            description: "Mostrar genes como secciones",
            default: false,
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["titulo"],
      },
    },
  },

  // GENERALES
  {
    type: "function",
    function: {
      name: "show_formula",
      description:
        "Muestra una fórmula matemática usando KaTeX. Úsalo para explicar ecuaciones de cualquier materia.",
      parameters: {
        type: "object",
        properties: {
          formula: {
            type: "string",
            description: "Fórmula en formato LaTeX. Ej: 'v = \\frac{d}{t}'",
          },
          nombre: {
            type: "string",
            description: "Nombre de la fórmula. Ej: 'Ecuación de posición'",
          },
          descripcion: {
            type: "string",
            description: "Breve descripción de qué significa la fórmula",
          },
        },
        required: ["formula"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_chart",
      description:
        "Crea un gráfico de barras o líneas. Úsalo para mostrar comparaciones de datos, evolución temporal, resultados.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["line", "bar"],
            description: "Tipo de gráfico",
          },
          titulo: { type: "string", description: "Título del gráfico" },
          datos: {
            type: "object",
            properties: {
              labels: {
                type: "array",
                items: { type: "string" },
                description: "Etiquetas del eje X",
              },
              datasets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    data: { type: "array", items: { type: "number" } },
                    color: { type: "string" },
                  },
                },
              },
            },
          },
          xLabel: { type: "string", description: "Etiqueta del eje X" },
          yLabel: { type: "string", description: "Etiqueta del eje Y" },
        },
        required: ["tipo", "titulo", "datos"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_diagram",
      description:
        "Crea un diagrama SVG. Úsalo para mostrar relaciones entre conceptos, diagramas de flujo, jerarquías.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "force",
              "motion",
              "energy",
              "timeline",
              "flowchart",
              "custom",
            ],
            description:
              "Tipo de diagrama: 'force' (fuerzas), 'motion' (movimiento), 'energy' (energía), 'timeline' (línea de tiempo), 'flowchart' (flujo), 'custom' (personalizado)",
          },
          elementos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tipo: { type: "string" },
                texto: { type: "string" },
                x: { type: "number" },
                y: { type: "number" },
                color: { type: "string" },
                tamano: { type: "number" },
              },
            },
          },
          titulo: { type: "string", description: "Título del diagrama" },
        },
        required: ["tipo", "titulo"],
      },
    },
  },
];

export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function chatWithOllama(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  tools?: OllamaToolDefinition[]
): Promise<AIResponse & { toolCalls?: OllamaToolCall[] }> {
  console.log("🔍 Ollama: Iniciando petición...");

  try {
    const formattedMessages: OllamaChatMessage[] = [
      ...messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    const requestBody: Record<string, any> = {
      model: "qwen2.5-coder",
      messages: [
        ...(systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }]
          : []),
        ...formattedMessages,
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    console.log("📡 Ollama: Enviando petición a", `${OLLAMA_API_URL}/chat`);

    const response = await fetch(`${OLLAMA_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Ollama: Respuesta recibida, status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error || `HTTP ${response.status}`;
      console.error("❌ Ollama: Error HTTP", response.status, errorMsg);
      return { success: false, error: `Error de Ollama: ${errorMsg}` };
    }

    const data = await response.json();
    console.log("✅ Ollama: Datos recibidos");

    const assistantMessage = data.message;
    let text = assistantMessage?.content || "";
    const toolCalls: OllamaToolCall[] = [];

    if (
      assistantMessage?.tool_calls &&
      assistantMessage.tool_calls.length > 0
    ) {
      for (const call of assistantMessage.tool_calls) {
        toolCalls.push({
          name: call.function?.name || call.name,
          parameters: call.function?.arguments || call.arguments || {},
        });
      }
    }

    if (!text && toolCalls.length === 0) {
      console.warn("⚠️ Ollama: Respuesta vacía");
      return { success: false, error: "Ollama no devolvió respuesta" };
    }

    return {
      success: true,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error de conexión";
    console.error("❌ Ollama error:", error);
    return { success: false, error: `Error al conectar con Ollama: ${error}` };
  }
}

export function getTutorTools(): OllamaToolDefinition[] {
  return TUTOR_TOOLS;
}

export function parseToolResult(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    return JSON.stringify(result, null, 2);
  }
  return String(result);
}
