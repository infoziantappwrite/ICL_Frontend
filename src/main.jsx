import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { FontSizeProvider } from "./context/FontSizeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ToastProvider>
          <FontSizeProvider>
            <App />
          </FontSizeProvider>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);