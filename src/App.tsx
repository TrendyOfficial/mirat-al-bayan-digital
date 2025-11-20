import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Category from "./pages/Category";
import Publication from "./pages/Publication";
import Search from "./pages/Search";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Publications from "./pages/admin/Publications";
import PublicationEditor from "./pages/admin/PublicationEditor";
import Authors from "./pages/admin/Authors";
import Users from "./pages/admin/Users";
import Categories from "./pages/admin/Categories";
import ActivityLogs from "./pages/admin/ActivityLogs";
import Settings from "./pages/Settings";
import DeletionReviews from "./pages/admin/DeletionReviews";
import Reports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";
import TurnstileGate from "./pages/TurnstileGate";

const queryClient = new QueryClient();

function GateGuard({ children }: any) {
  const passed = localStorage.getItem("turnstile_passed") === "true";
  return passed ? children : <Navigate to="/verify" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              {/* TURNSTILE VERIFICATION ROUTE */}
              <Route path="/verify" element={<TurnstileGate />} />

              {/* ALL OTHER ROUTES PROTECTED BY TURNSTILE */}
              <Route
                path="/*"
                element={
                  <GateGuard>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/category/:slug" element={<Category />} />
                      <Route path="/publication/:slug" element={<Publication />} />
                      <Route path="/search" element={<Search />} />

                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute>
                            <AdminLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Dashboard />} />
                        <Route path="publications" element={<Publications />} />
                        <Route path="publications/new" element={<PublicationEditor />} />
                        <Route path="publications/edit/:id" element={<PublicationEditor />} />
                        <Route path="authors" element={<Authors />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="logs" element={<ActivityLogs />} />
                        <Route path="users" element={<Users />} />
                        <Route path="deletion-reviews" element={<DeletionReviews />} />
                        <Route path="reports" element={<Reports />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </GateGuard>
                }
              />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
