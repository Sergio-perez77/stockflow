"use client";

import { useEffect, useMemo, useState } from "react";

import { createUser, DEMO_USER, getUsers, type SessionUser } from "@/lib/auth";

const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  role: "vendedor" as SessionUser["role"],
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<SessionUser[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    setUsuarios(getUsers());
  }, []);

  const totalAdmins = useMemo(
    () => usuarios.filter((user) => user.role === "admin").length,
    [usuarios]
  );

  const manejarCambio = (campo: keyof typeof EMPTY_FORM, valor: string) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarUsuario = () => {
    setError("");
    setOk("");

    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y email son obligatorios.");
      return;
    }

    const nuevo = createUser(usuarios, {
      nombre: form.nombre,
      email: form.email,
      password: form.password || "stockflow123",
      role: form.role,
    });

    if (!nuevo) {
      setError("Ya existe un usuario con ese email.");
      return;
    }

    const siguiente = getUsers();
    setUsuarios(siguiente);
    setForm(EMPTY_FORM);
    setOk("Usuario creado correctamente.");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Usuarios</h1>
        <p className="text-gray-400">Gestioná acceso, roles y administración del negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total</p>
          <p className="mt-2 text-3xl font-bold text-white">{usuarios.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Administradores</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400">{totalAdmins}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Demo</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{DEMO_USER.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usuarios registrados</h2>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3">{usuario.nombre}</td>
                    <td className="px-4 py-3">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs uppercase text-cyan-300">
                        {usuario.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Crear usuario</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => manejarCambio("nombre", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => manejarCambio("email", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="juan@empresa.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => manejarCambio("password", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="stockflow123"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Rol</label>
              <select
                value={form.role}
                onChange={(e) => manejarCambio("role", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="admin">Admin</option>
                <option value="gerente">Gerente</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {ok && <p className="text-sm text-emerald-400">{ok}</p>}

            <button
              type="button"
              onClick={guardarUsuario}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Crear usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
