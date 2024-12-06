import React, { useEffect, useState } from "react";
import axios from '../../../api/axios';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/auth/users");
        setUsers(response.data);
      } catch (err) {
        setError("Error al obtener los usuarios.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-gray-600">
      Cargando usuarios...
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Lista de Usuarios</h1>
      
      {users.length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          No hay usuarios disponibles.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-semibold mr-2 text-gray-600">Nombre:</span>
                  <span className="text-gray-800">{user.username}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2 text-gray-600">Email:</span>
                  <span className="text-gray-800">{user.email}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2 text-gray-600">Tipo:</span>
                  <span className="text-gray-800">{user.tipo}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2 text-gray-600">Estado:</span>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${user.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {user.estado}
                  </span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2 text-gray-600">Teléfono:</span>
                  <span className="text-gray-800">{user.telefono}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTable;