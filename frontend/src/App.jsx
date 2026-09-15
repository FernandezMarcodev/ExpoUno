import React from "react";
import { Routes, Route } from "react-router-dom";
import Inicio from "./paginas/Inicio.jsx";
import Login from "./paginas/Login.jsx";
import Registro from "./paginas/Registro.jsx";
import MisFavoritos from "./paginas/MisFavoritos.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/favoritos" element={<MisFavoritos />} />
    </Routes>
  );
}

export default App;