import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
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
                <Route 
                  path="categories" 
                  element={
                    <ProtectedRoute requiredRole="editor">
                      <Categories />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="logs" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ActivityLogs />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Users />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
