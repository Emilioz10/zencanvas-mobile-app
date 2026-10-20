import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// כאן אנחנו מייבאים את הדפים שלך
import Dashboard from "./pages/Dashboard";
import Canvas from "./pages/Canvas";
import Inbox from "./pages/Inbox";
import Tasks from "./pages/Tasks";
import Timeline from "./pages/Timeline";
import PeopleHub from "./pages/PeopleHub";
import FinanceSnapshot from "./pages/FinanceSnapshot";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/canvas" component={Canvas} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/people" component={PeopleHub} />
      <Route path="/finance" component={FinanceSnapshot} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;