import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/syllabus" element={<AppLayout><SyllabusTracker /></AppLayout>} />
          <Route path="/sample-paper" element={<AppLayout><SamplePaper /></AppLayout>} />
          <Route path="/worksheet" element={<AppLayout><ChapterWorksheet /></AppLayout>} />
          <Route path="/revision-notes" element={<AppLayout><RevisionNotes /></AppLayout>} />
          <Route path="/mcq" element={<AppLayout><MCQPractice /></AppLayout>} />
          <Route path="/pyq" element={<AppLayout><PYQSection /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/library" element={<AppLayout><MyLibrary /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

then push:
```
cd ~/Documents/claude-commerce-buddy && git add . && git commit -m "remove login, restore original app" && git push