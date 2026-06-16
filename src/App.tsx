import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./routes/LoginPage";
import { FeedPage } from "./routes/FeedPage";
import { ExplorePage } from "./routes/ExplorePage";
import { CommunitiesPage } from "./routes/CommunitiesPage";
import { CommunityDetailPage } from "./routes/CommunityDetailPage";
import { NewCommunityPage } from "./routes/NewCommunityPage";
import { ProfilePage } from "./routes/ProfilePage";
import { MessagesPage } from "./routes/MessagesPage";
import { AboutPage } from "./routes/AboutPage";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  if (isAuthed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<FeedPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/new" element={<NewCommunityPage />} />
              <Route path="/community/:id" element={<CommunityDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:partnerId" element={<MessagesPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
