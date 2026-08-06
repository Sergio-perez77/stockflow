"use client";
import StatCard from "@/components/dashboard/StatCard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentProducts from "@/components/dashboard/RecentProducts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentOrders from "@/components/dashboard/RecentOrders";


import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Producto } from "@/types/producto";
import type { Cliente } from "@/types/cliente";
import type { Proveedor } from "@/types/proveedor";
import type { Venta } from "@/types/venta";

import LowStockProducts from "@/components/dashboard/LowStockProducts";



export default function DashboardPage() {

  const { datos: productos } =
  useLocalStorage<Producto>("productos");

const { datos: clientes } =
  useLocalStorage<Cliente>("clientes");

const { datos: proveedores } =
  useLocalStorage<Proveedor>("proveedores");

const { datos: ventas } =
  useLocalStorage<Venta>("ventas");

const totalVentas = ventas.reduce(
  (total, venta) => total + Number(venta.total),
  0
);

const stockBajo = productos.filter(
  (producto) => producto.stock <= 5
).length;

const valorInventario = productos.reduce(
  (total, producto) =>
    total +
    Number(producto.precio.replace("$", "")) *
      producto.stock,
  0
);


const productosMasVendidos = ventas.reduce((acc, venta) => {

  venta.items.forEach((item) => {

    const existente = acc.find(
      (p) => p.nombre === item.producto
    );

    if (existente) {
      existente.cantidad += item.cantidad;
    } else {
      acc.push({
        nombre: item.producto,
        cantidad: item.cantidad,
      });
    }

  });

  return acc;

}, [] as { nombre: string; cantidad: number }[]);

productosMasVendidos.sort(
  (a, b) => b.cantidad - a.cantidad
);

  return (
    <>
      <h1 className="text-4xl font-bold mb-2">
        Dashboard
      </h1>

      <p className="text-gray-400 mb-8">
        Bienvenido a StockFlow.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

       <StatCard
          title="Ventas"
          value={`$${totalVentas}`}
          color="text-green-400"
        />

        <StatCard
          title="Productos"
          value={productos.length.toString()}
          color="text-cyan-400"
        />

        <StatCard
          title="Clientes"
          value={clientes.length.toString()}
          color="text-yellow-400"
        />

        <StatCard
          title="Stock bajo"
          value={stockBajo.toString()}
          color="text-red-400"
        />

        <StatCard
          title="Inventario"
          value={`$${valorInventario}`}
          color="text-emerald-400"
        />

      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2">
          <SalesChart />
        </div>

        <div className="space-y-6">
          <RecentProducts />
          <LowStockProducts />

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h2 className="text-xl font-semibold mb-6">
              Productos más vendidos
            </h2>

            {productosMasVendidos.length === 0 ? (
              <p className="text-gray-400">
                Todavía no hay ventas registradas.
              </p>
            ) : (
              <div className="space-y-3">

                {productosMasVendidos.slice(0, 5).map((producto, index) => (
                  <div
                    key={`${producto.nombre}-${index}`}
                    className="flex justify-between border-b border-slate-800 pb-2"
                  >
                    <span>{producto.nombre}</span>

                    <span className="font-bold text-cyan-400">
                      {producto.cantidad}
                    </span>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

      </div>

      <RecentActivity />
  
      <RecentOrders />
    </>
  );

 


}