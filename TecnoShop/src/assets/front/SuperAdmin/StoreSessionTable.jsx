import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Trash2, Edit2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const StoreSessionTable = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const response = await axios.get("/tiendasprodcutos");
        setTiendas(response.data || []);
      } catch (err) {
        console.error("Error al obtener las tiendas:", err);
        setError("Hubo un error al cargar las tiendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchTiendas();
  }, []);

  const actualizarEstado = async (tiendaId, nuevoEstado) => {
    try {
      const response = await axios.put(`/sup/tiendas/${tiendaId}`, { estado: nuevoEstado });
      setTiendas((prev) =>
        prev.map((tienda) =>
          tienda.tienda._id === tiendaId ? { ...tienda, tienda: response.data.tienda } : tienda
        )
      );
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
      alert("Hubo un error al actualizar el estado.");
    }
  };

  const eliminarTienda = async (tiendaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tienda?")) return;

    try {
      await axios.delete(`/sup/tiendas/${tiendaId}`);
      setTiendas((prev) => prev.filter((tienda) => tienda.tienda._id !== tiendaId));
    } catch (err) {
      console.error("Error al eliminar la tienda:", err);
      alert("Hubo un error al eliminar la tienda.");
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active':
        return <CheckCircle className="text-green-500" />;
      case 'inactive':
        return <XCircle className="text-red-500" />;
      default:
        return <AlertCircle className="text-yellow-500" />;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tiendas y Productos</h1>
      {tiendas.length === 0 ? (
        <div className="text-center text-gray-500 p-8 bg-gray-100 rounded-lg">
          No hay tiendas disponibles.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiendas.map((tienda, index) => {
            const tiendaInfo = tienda?.tienda || {};
            const productos = tienda?.productos || [];

            return (
              <div 
                key={tiendaInfo._id || index} 
                className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className="p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {tiendaInfo.nombre || "Nombre no disponible"}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tiendaInfo.subscription_status)}
                      <select
                        value={tiendaInfo.subscription_status || "pending"}
                        onChange={(e) => actualizarEstado(tiendaInfo._id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-gray-600 mb-4">
                    <p>{tiendaInfo.descripcion || "Descripción no disponible"}</p>
                    <p><strong>Dirección:</strong> {tiendaInfo.direccion || "No especificada"}</p>
                    <p><strong>Teléfono:</strong> {tiendaInfo.telefono || "No especificado"}</p>
                  </div>
                  
                  <button
                    onClick={() => eliminarTienda(tiendaInfo._id)}
                    className="w-full flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="mr-2" /> Eliminar Tienda
                  </button>
                </div>

                <div className="p-6 bg-gray-100">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Productos</h3>
                  {productos.length === 0 ? (
                    <p className="text-gray-500 text-center">No hay productos disponibles.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {productos.map((producto) => (
                        <div 
                          key={producto._id} 
                          className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                        >
                          <img
                            src={producto.imagenes?.[0] || "https://via.placeholder.com/150"}
                            alt={producto.nombre || "Producto sin nombre"}
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-medium text-gray-800 mb-2">
                              {producto.nombre || "Sin nombre"}
                            </h4>
                            <div className="flex justify-between items-center">
                              <span className="text-green-600 font-bold">
                                ${producto.precio?.toFixed(2) || "0.00"}
                              </span>
                              <span className="text-sm text-gray-500">
                                {producto.estado || "No especificado"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreSessionTable;