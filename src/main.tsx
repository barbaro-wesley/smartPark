import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ParkingProvider } from "@/context/ParkingContext";
import HomePage from "@/app/HomePage";
import PainelPage from "@/app/PainelPage";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ParkingProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/painel" element={<PainelPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </ParkingProvider>
    </BrowserRouter>
  </React.StrictMode>
);
