import React from "react";
import { Routes, Route } from "react-router-dom";
import Inicio from "./paginas/Inicio.jsx";
import Login from "./paginas/Login.jsx";
import Registro from "./paginas/Registro.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
    </Routes>
  );
}

export default App;