import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import SyllabusTracker from "./pages/SyllabusTracker";
import SamplePaper from "./pages/SamplePaper";
import ChapterWorksheet from "./pages/ChapterWorksheet";
import RevisionNotes from "./pages/RevisionNotes";
import MCQPractice from "./pages/MCQPractice";
import PYQSection from "./pages/PYQSection";
import Analytics from "./pages/Analytics";
import MyLibrary from "./pages/MyLibrary";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider, RequireAuth } from "./lib/auth";

const queryClient = new QueryClient();

function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/syllabus" element={<SyllabusTracker />} />
              <Route path="/sample-paper" element={<SamplePaper />} />
              <Route path="/worksheet" element={<ChapterWorksheet />} />
              <Route path="/revision-notes" element={<RevisionNotes />} />
              <Route path="/mcq" element={<MCQPractice />} />
              <Route path="/pyq" element={<PYQSection />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/library" element={<MyLibrary />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
