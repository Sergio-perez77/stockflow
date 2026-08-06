import type { Venta } from "@/types/venta";

type Props = {
  venta: Venta;
};

export default function ComprobanteVenta({
  venta,
}: Props) {
  return (
    <div className="bg-white text-black rounded-xl p-8 max-w-2xl mx-auto">

      <h1 className="text-3xl font-bold mb-2">
        StockFlow
      </h1>

      <p className="text-gray-500 mb-8">
        Comprobante de Venta
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">

        <div>

          <strong>Código</strong>

          <p>{venta.codigo}</p>

        </div>

        <div>

          <strong>Fecha</strong>

          <p>{venta.fecha}</p>

        </div>

        <div>

          <strong>Cliente</strong>

          <p>{venta.cliente}</p>

        </div>

        <div>

          <strong>Método de pago</strong>

          <p>{venta.metodoPago}</p>

        </div>

        <div>

          <strong>Estado</strong>

          <p>{venta.estado}</p>

        </div>

      </div>

      <table className="w-full border">

        <thead>

          <tr>

            <th>Producto</th>

            <th>Cant.</th>

            <th>Precio</th>

            <th>Subtotal</th>

          </tr>

        </thead>

        <tbody>

          {venta.items.map((item) => (

            <tr key={item.productoId}>

              <td>{item.producto}</td>

              <td>{item.cantidad}</td>

              <td>${item.precio}</td>

              <td>${item.subtotal}</td>

            </tr>

          ))}

        </tbody>

      </table>

      <div className="mt-8 text-right">

        <h2 className="text-2xl font-bold">

          Total: ${venta.total}

        </h2>

      </div>

      {venta.observaciones && (

        <div className="mt-8">

          <strong>Observaciones</strong>

          <p>{venta.observaciones}</p>

        </div>

      )}

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={() => window.print()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg"
        >
          Imprimir
        </button>

      </div>

    </div>
  );
}