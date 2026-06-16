import React from "react";
import ReactDOM from "react-dom/client";
import DashboardPage from "./app/page.tsx";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DashboardPage />
  </React.StrictMode>
);
