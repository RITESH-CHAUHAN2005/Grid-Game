import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./styles.css";
import { RootLayout } from "./routes/__root";
import { HomePage } from "./routes/index";
import { AuthPage } from "./routes/auth";
import { MatchPage } from "./routes/match";
import { ActivityPage } from "./routes/activity";
import { NotFoundPage } from "./routes/not-found";
import { AuthProvider } from "./lib/auth";
import { AuthGate, GuestOnly } from "./components/AuthGate";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<RootLayout />}>
              <Route
                path="/auth"
                element={
                  <GuestOnly>
                    <AuthPage />
                  </GuestOnly>
                }
              />
              <Route
                index
                element={
                  <AuthGate>
                    <HomePage />
                  </AuthGate>
                }
              />
              <Route
                path="/match/:code"
                element={
                  <AuthGate>
                    <MatchPage />
                  </AuthGate>
                }
              />
              <Route
                path="/activity"
                element={
                  <AuthGate>
                    <ActivityPage />
                  </AuthGate>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
