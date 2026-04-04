import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Journal from "./pages/Journal";
import UnsentMessages from "./pages/UnsentMessages";
import NoContactTracker from "./pages/NoContactTracker";
import EmotionalTrigger from "./pages/EmotionalTrigger";
import DailyTasks from "./pages/DailyTasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/unsent" element={<UnsentMessages />} />
          <Route path="/tracker" element={<NoContactTracker />} />
          <Route path="/trigger" element={<EmotionalTrigger />} />
          <Route path="/tasks" element={<DailyTasks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
