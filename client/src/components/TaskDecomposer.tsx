import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface DecomposedTask {
  title: string;
  description: string;
  effort: "small" | "medium" | "large";
  dependencies: string[];
}

export function TaskDecomposer({ onTasksGenerated }: { onTasksGenerated?: (tasks: DecomposedTask[]) => void }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<DecomposedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const handleDecompose = async () => {
    if (!input.trim()) {
      toast.error("Please enter a task to decompose");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate AI decomposition with demo data
      // In production, this would call an AI service
      const demoTasks: DecomposedTask[] = [
        {
          title: "Research and planning",
          description: "Gather requirements and create a plan",
          effort: "small",
          dependencies: [],
        },
        {
          title: "Design and architecture",
          description: "Design the system architecture",
          effort: "medium",
          dependencies: ["Research and planning"],
        },
        {
          title: "Implementation",
          description: "Build the core functionality",
          effort: "large",
          dependencies: ["Design and architecture"],
        },
        {
          title: "Testing and QA",
          description: "Test and fix issues",
          effort: "medium",
          dependencies: ["Implementation"],
        },
        {
          title: "Documentation",
          description: "Write documentation and guides",
          effort: "small",
          dependencies: ["Implementation"],
        },
      ];

      setTasks(demoTasks);
      toast.success("Task decomposed into subtasks");
    } catch (error) {
      toast.error("Failed to decompose task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTasks = () => {
    const selectedSubtasks = Array.from(selectedTasks).map(i => tasks[i]!);
    if (selectedSubtasks.length === 0) {
      toast.error("Please select at least one subtask");
      return;
    }

    if (onTasksGenerated) {
      onTasksGenerated(selectedSubtasks);
    }
    toast.success(`Created ${selectedSubtasks.length} subtasks`);
    setTasks([]);
    setSelectedTasks(new Set());
    setInput("");
  };

  const effortColors = {
    small: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    large: "bg-red-100 text-red-800",
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Task Breakdown
        </CardTitle>
        <CardDescription>
          Enter a vague or complex task and AI will break it into actionable subtasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <div className="space-y-3">
            <Textarea
              placeholder="e.g., Build a mobile app for tracking habits"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-24"
              disabled={isLoading}
            />
            <Button
              onClick={handleDecompose}
              disabled={isLoading || !input.trim()}
              className="w-full gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Decomposing..." : "Decompose Task"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Select subtasks to create:</p>
            {tasks.map((task, idx) => (
              <div key={idx} className="flex gap-3 p-3 border border-soft rounded-lg">
                <Checkbox
                  checked={selectedTasks.has(idx)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedTasks);
                    if (checked) {
                      newSelected.add(idx);
                    } else {
                      newSelected.delete(idx);
                    }
                    setSelectedTasks(newSelected);
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-calm mt-1">{task.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${effortColors[task.effort]}`}>
                      {task.effort} effort
                    </span>
                    {task.dependencies.length > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Depends on: {task.dependencies.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTasks}
                className="flex-1"
              >
                Create Selected Subtasks
              </Button>
              <Button
                onClick={() => {
                  setTasks([]);
                  setSelectedTasks(new Set());
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
