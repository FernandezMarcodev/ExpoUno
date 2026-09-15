import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./contextos/AuthContext.jsx";
import { FavoritosProvider } from "./contextos/FavoritosContext.jsx";
import { SeguidosProvider } from "./contextos/SeguidosContext.jsx";
import { NovedadesProvider } from "./contextos/NovedadesContext.jsx";
import "./index.css"; // Tailwind

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritosProvider>
          <SeguidosProvider>
            <NovedadesProvider>
              <App />
            </NovedadesProvider>
          </SeguidosProvider>
        </FavoritosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);