import React, { useEffect, useState } from "react";
import axios from "../../../api/axios";
import Sidebar from "./components/Sidebar";

const SubscriptionStatus = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await axios.get('/suscripcion', { withCredentials: true });
        setSubscriptionData(response.data.tienda);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar la suscripción');
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (daysRemaining) => {
    if (daysRemaining > 15) return 'bg-green-500';
    if (daysRemaining > 7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <section className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl bg-red-50 p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-semibold text-red-800">Error de Suscripción</h3>
        <p className="text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Estado de Suscripción</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionData.subscriptionStatus)}`}>
          {subscriptionData.subscriptionStatus === 'active' ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Días restantes</span>
            <span>{subscriptionData.subscriptionDaysRemaining} días</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getProgressColor(subscriptionData.subscriptionDaysRemaining)}`}
              style={{ width: `${Math.min(subscriptionData.subscriptionDaysRemaining / 30 * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Fecha de Expiración</p>
            <p className="font-semibold text-gray-800">
              {new Date(subscriptionData.subscriptionExpirationDate).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Plan Actual</p>
            <p className="font-semibold text-gray-800">Estándar</p>
          </div>
        </div>

        <button 
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {/* Implementar lógica de renovación */}}
        >
          Renovar Suscripción
        </button>
      </div>
    </section>
  );
};

export default function AdminDashboard() {
  const [topProducts, setTopProducts] = useState([]);
  const [totalTienda, setTotalTienda] = useState(0);
  const [rating, setRating] = useState(4.5);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const fetchTotalTienda = async () => {
    try {
      const { data } = await axios.get("/pedidos/tienda/total", { withCredentials: true });
      setTotalTienda(data.totalTienda || 0);
    } catch (err) {
      setError("Error al obtener el total de ingresos.");
      console.error(err);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const { data } = await axios.get("/pedidos/tienda/producto-mas-vendido", { withCredentials: true });
      setTopProducts([
        {
          name: data.producto.nombre,
          sales: data.producto.cantidadVendida,
        },
      ]);
    } catch (err) {
      setError("Error al obtener el producto más vendido.");
      console.error(err);
    }
  };

  const fetchReviews = () => {
    setReviews([
      { user: "Juan Pérez", comment: "Excelente calidad y entrega rápida.", rating: 5 },
      { user: "Ana García", comment: "El producto llegó en buenas condiciones.", rating: 4 },
      { user: "Carlos López", comment: "Buena relación calidad-precio.", rating: 4 },
    ]);
  };

  useEffect(() => {
    const termsAccepted = localStorage.getItem("termsAccepted");
    if (!termsAccepted) {
      setShowTermsModal(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem("termsAccepted", "true");
    setShowTermsModal(false);
  };

  useEffect(() => {
    fetchTotalTienda();
    fetchTopProducts();
    fetchReviews();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 antialiased">
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all duration-300 ease-in-out">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Términos y Condiciones</h2>
            <p className="mb-4 text-gray-700">
              Bienvenido a nuestra tienda de tecnología. Al utilizar nuestro sitio web, aceptas los
              siguientes términos y condiciones:
            </p>
            <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
              <li>Todos los productos ofrecidos están sujetos a disponibilidad y a cambios sin previo aviso.</li>
              <li>Nos reservamos el derecho de modificar los precios de los productos en cualquier momento.</li>
              <li>Los usuarios deben proporcionar información precisa para el envío y la facturación.</li>
              <li>Cualquier intento de uso fraudulento de nuestros servicios será penalizado.</li>
              <li>Al realizar compras en nuestra tienda, aceptas nuestras políticas de devolución y garantía.</li>
            </ul>
            <button
              onClick={handleAcceptTerms}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Aceptar y Continuar
            </button>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <h2 className="mb-6 text-4xl font-extrabold text-gray-900">Panel del Vendedor</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Total de Ingresos */}
          <section className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Total de Ingresos</h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">${totalTienda.toFixed(2)}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </section>

          {/* Top Productos Vendidos */}
          <section className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Top Productos Vendidos</h3>
            <ul className="space-y-2">
              {topProducts.map((product, index) => (
                <li key={index} className="flex items-center justify-between rounded-md bg-gray-100 p-3">
                  <span className="font-medium text-gray-800">{product.name}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                    Ventas: {product.sales}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Puntuación Promedio */}
          <section className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Puntuación Promedio</h3>
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-yellow-500">{rating}</span>
              <div className="text-right">
                <p className="text-sm text-gray-600">Basado en {reviews.length} reseñas</p>
                <div className="mt-1 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Subscription Status Component */}
          <SubscriptionStatus />

  {/* Reseñas Recientes */}
<section className="col-span-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
  <h3 className="mb-4 text-xl font-semibold text-gray-700">Reseñas Recientes</h3>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {reviews.map((review, index) => (
      <div key={index} className="rounded-lg bg-gray-100 p-4 transition-all duration-300 hover:shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-gray-800">{review.user}</p>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600">{review.comment}</p>
      </div>
    ))}
  </div>
</section>

          {/* Reseñas Recientes */}
          <section className="col-span-full rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Reseñas Recientes</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, index) => (
                <div key={index} className="rounded-lg bg-gray-100 p-4 transition-all duration-300 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{review.user}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}