import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open command palette (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // TODO: Open command palette
      }

      // Cmd/Ctrl + N: New node
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setLocation("/node/new");
      }

      // Cmd/Ctrl + /: Open help
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowHelp(true);
      }

      // Cmd/Ctrl + G: Go to graph/canvas
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        setLocation("/canvas");
      }

      // Cmd/Ctrl + T: Go to tasks
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        setLocation("/tasks");
      }

      // Cmd/Ctrl + I: Go to inbox
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setLocation("/inbox");
      }

      // Cmd/Ctrl + D: Go to dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setLocation("/dashboard");
      }

      // Escape: Go back or close modals
      if (e.key === "Escape") {
        // This is handled by individual components
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  return { showHelp, setShowHelp };
}
