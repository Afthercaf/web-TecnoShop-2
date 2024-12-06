import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/pedidos/usuario', { withCredentials: true });
        console.log(response.data.pedidos); // Asegúrate de que los datos están como esperas
        const fetchedOrders = Array.isArray(response.data.pedidos) ? response.data.pedidos : [];
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        setOrders([]);
        setFilteredOrders([]);
      }
    };
  
    fetchOrders();
  }, []);
  
  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;
    setFilter(selectedFilter);
    setFilteredOrders(
      selectedFilter
        ? orders.filter((order) =>
            order.status.toLowerCase().includes(selectedFilter.toLowerCase())
          )
        : orders
    );
  };

  const handleReorder = (productName) => {
    alert(`Reordenando: ${productName}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-6">Mis Pedidos</h2>

        <div className="mb-6">
          <label htmlFor="filter" className="block mb-2 text-gray-700">
            Filtrar por estado:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={handleFilterChange}
            className="w-full p-3 border border-gray-300 rounded-md"
          >
            <option value="">Todos</option>
            <option value="Enviado">Enviado</option>
            <option value="En preparación">En preparación</option>
          </select>
        </div>

        {filteredOrders.length > 0 ? (
  <ul className="space-y-6">
    {filteredOrders.map((pedido) => (
      <li
        key={pedido._id}
        className="p-6 bg-gray-50 rounded-lg shadow flex flex-col space-y-4"
      >
        {pedido.productos.map((producto) => (
          <div
            key={producto.productoId?._id || producto._id}
            className="flex items-start w-full"
          >
            {/* Imagen: Marcador de posición porque no hay campo explícito para imágenes */}
            <img
                src={producto.productoId?.imagenes || '/placeholder.png'}
              alt="Imagen no disponible"
              className="w-24 h-24 object-cover rounded-lg mr-6"
            />
            {/* Nombre del Producto */}
            <div className="flex-1">
              <p className="mb-2">
                <strong>Producto:</strong> {producto.productoId?.nombre || 'Sin nombre'}
              </p>
              <p className="mb-2">
                <strong>Cantidad:</strong> {producto.cantidad}
              </p>
              <p className="mb-2">
                <strong>Precio unitario:</strong> ${producto.precioUnitario}
              </p>
              <p className="mb-2">
                <strong>Subtotal:</strong> ${producto.subtotal}
              </p>
            </div>
          </div>
        ))}
        <div className="flex-1 mt-4">
          <p>
            <strong>Estado del pedido:</strong> {pedido.estado}
          </p>
          <p>
            <strong>Método de pago:</strong> {pedido.metodoPago}
          </p>
          <p>
            <strong>Dirección de envío:</strong> {pedido.direccionEnvio}
          </p>
        </div>
      </li>
    ))}
  </ul>
) : (
  <p className="text-center text-gray-600">No tienes pedidos aún.</p>
)}


      </div>
    </div>
  );
};

export default UserOrders;
