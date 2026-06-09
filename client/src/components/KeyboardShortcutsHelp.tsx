import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { keys: ["Cmd/Ctrl", "N"], description: "Create new node" },
    { keys: ["Cmd/Ctrl", "G"], description: "Go to graph canvas" },
    { keys: ["Cmd/Ctrl", "T"], description: "Go to tasks" },
    { keys: ["Cmd/Ctrl", "I"], description: "Go to inbox" },
    { keys: ["Cmd/Ctrl", "D"], description: "Go to dashboard" },
    { keys: ["Cmd/Ctrl", "/"], description: "Show this help" },
    { keys: ["Escape"], description: "Close dialogs" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate ZenCanvas faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-soft last:border-0">
              <span className="text-sm text-calm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <div key={keyIdx} className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {key}
                    </Badge>
                    {keyIdx < shortcut.keys.length - 1 && (
                      <span className="text-xs text-calm">+</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
