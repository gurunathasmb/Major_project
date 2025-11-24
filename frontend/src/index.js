// filepath: C:\Users\mohit\Desktop\Major project\src\index.js
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { DoctorProvider } from "./context/DoctorContext";
import { PatientProvider } from "./context/PatientContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DoctorProvider>
      <PatientProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PatientProvider>
    </DoctorProvider>
  </React.StrictMode>
);