"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Negocio } from "@/types/negocio";

import { useEffect, useState } from "react";

export default function BusinessSettings() {

  const {
    datos,
    setDatos,
  } = useLocalStorage<Negocio>("negocio");

  const negocioGuardado =
  datos[0] ?? {
    nombre: "",
    logo: "",
    propietario: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    pais: "Argentina",
    codigoPostal: "",
    moneda: "ARS",
    simboloMoneda: "$",
  };

  useEffect(() => {
  setNegocio(negocioGuardado);
}, [datos]);

const [negocio, setNegocio] = useState(negocioGuardado);

  function actualizar(
  campo: keyof Negocio,
  valor: string
) {
  setNegocio({
    ...negocio,
    [campo]: valor,
  });
}

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Información del negocio
      </h2>

      <p className="text-gray-400 mb-6">
        Estos datos se utilizarán en comprobantes, reportes y futuras integraciones.
      </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <input
                    value={negocio.nombre}
                    onChange={(e) =>
                    actualizar("nombre", e.target.value)
                    }
                    placeholder="Nombre del negocio"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                    value={negocio.propietario}
                    onChange={(e) =>
                    actualizar("propietario", e.target.value)
                    }
                    placeholder="Propietario"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                    value={negocio.email}
                    onChange={(e) =>
                    actualizar("email", e.target.value)
                    }
                    placeholder="Email"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                    value={negocio.telefono}
                    onChange={(e) =>
                    actualizar("telefono", e.target.value)
                    }
                    placeholder="Teléfono"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                value={negocio.direccion}
                onChange={(e) =>
                    actualizar("direccion", e.target.value)
                }
                placeholder="Dirección"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                value={negocio.ciudad}
                onChange={(e) =>
                    actualizar("ciudad", e.target.value)
                }
                placeholder="Ciudad"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                value={negocio.provincia}
                onChange={(e) =>
                    actualizar("provincia", e.target.value)
                }
                placeholder="Provincia / Estado"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                value={negocio.codigoPostal}
                onChange={(e) =>
                    actualizar("codigoPostal", e.target.value)
                }
                placeholder="Código postal"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <select
                value={negocio.pais}
                onChange={(e) =>
                    actualizar("pais", e.target.value)
                }
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                >
                <option value="Argentina">Argentina</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Chile">Chile</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Brasil">Brasil</option>
                <option value="México">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Perú">Perú</option>
                <option value="España">España</option>
                <option value="Estados Unidos">Estados Unidos</option>
                </select>

                <select
                value={negocio.moneda}
                onChange={(e) => {

                    const nuevaMoneda = e.target.value;

                    actualizar("moneda", nuevaMoneda);

                    const simbolos: Record<string, string> = {
                    ARS: "$",
                    USD: "US$",
                    EUR: "€",
                    UYU: "$U",
                    CLP: "$",
                    PYG: "₲",
                    BRL: "R$",
                    MXN: "$",
                    COP: "$",
                    PEN: "S/",
                    };

                    actualizar(
                    "simboloMoneda",
                    simbolos[nuevaMoneda] ?? "$"
                    );
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                >
                <option value="ARS">Peso argentino (ARS)</option>
                <option value="USD">Dólar estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="UYU">Peso uruguayo (UYU)</option>
                <option value="CLP">Peso chileno (CLP)</option>
                <option value="PYG">Guaraní paraguayo (PYG)</option>
                <option value="BRL">Real brasileño (BRL)</option>
                <option value="MXN">Peso mexicano (MXN)</option>
                <option value="COP">Peso colombiano (COP)</option>
                <option value="PEN">Sol peruano (PEN)</option>
                </select>

            </div>

            <div className="flex justify-end mt-6">

                <button
                    onClick={() => setDatos([negocio])}
                    className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-semibold"
                >
                    Guardar cambios
                </button>

            </div>

        </div>
  );

}