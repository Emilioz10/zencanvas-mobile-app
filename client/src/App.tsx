import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import Dashboard from "./pages/Dashboard";
import Canvas from "./pages/Canvas";
import Inbox from "./pages/Inbox";
import Tasks from "./pages/Tasks";
import Timeline from "./pages/Timeline";
import NodeDetail from "./pages/NodeDetail";
import LifeDomains from "./pages/LifeDomains";
import ModuleHub from "./pages/ModuleHub";
import ModuleDetail from "./pages/ModuleDetail";
import DailyTracker from "./pages/DailyTracker";
import AppMap from "./pages/AppMap";

function Router() {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
    <Switch>
      <Route path={"/"} component={ModuleHub} />
      <Route path={"/home"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/canvas"} component={Canvas} />
      <Route path={"/inbox"} component={Inbox} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/timeline"} component={Timeline} />
      <Route path={"/node/:id"} component={NodeDetail} />
      <Route path={"/node/new"} component={NodeDetail} />
      <Route path={"/domains"} component={LifeDomains} />
      <Route path={"/module/:moduleType"} component={ModuleDetail} />
      <Route path={"/tracker"} component={DailyTracker} />
      <Route path={"/appmap"} component={AppMap} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
