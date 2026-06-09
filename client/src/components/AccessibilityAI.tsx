import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Zap, Tag, Link2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AccessibilityAIProps {
  nodeBody: string;
  nodeType?: string;
  onApplySuggestion?: (suggestion: any) => void;
}

/**
 * Accessibility-First AI Component
 * Helps users with cognitive disabilities structure and express their thoughts
 */
export function AccessibilityAI({ nodeBody, nodeType, onApplySuggestion }: AccessibilityAIProps) {
  const [activeTab, setActiveTab] = useState<"express" | "classify" | "structure" | "purpose">(
    "express"
  );
  const [result, setResult] = useState<any>(null);

  // Expression Assistant mutation
  const expressionMutation = trpc.ai.expressionAssistant.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResult({ type: "expression", content: data.suggestion, provider: data.provider });
      } else {
        toast.error(data.error || "Could not process expression");
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Purpose Clarifier mutation
  const purposeMutation = trpc.ai.purposeClarifier.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResult({ type: "purpose", content: data.purpose, provider: data.provider });
      } else {
        toast.error(data.error || "Could not identify purpose");
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Auto-Classifier mutation
  const classifierMutation = trpc.ai.autoClassifier.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResult({
          type: "classification",
          content: data.classification,
          provider: data.provider,
        });
      } else {
        toast.error(data.error || "Could not classify content");
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Content Structurer mutation
  const structurerMutation = trpc.ai.contentStructurer.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResult({ type: "structured", content: data.structured, provider: data.provider });
      } else {
        toast.error(data.error || "Could not structure content");
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const isLoading =
    expressionMutation.isPending ||
    purposeMutation.isPending ||
    classifierMutation.isPending ||
    structurerMutation.isPending;

  const handleExpressionAssistant = () => {
    if (!nodeBody.trim()) {
      toast.error("Please write something first");
      return;
    }
    expressionMutation.mutate({ text: nodeBody });
  };

  const handlePurposeClarifier = () => {
    if (!nodeBody.trim()) {
      toast.error("Please write something first");
      return;
    }
    purposeMutation.mutate({ text: nodeBody });
  };

  const handleAutoClassifier = () => {
    if (!nodeBody.trim()) {
      toast.error("Please write something first");
      return;
    }
    classifierMutation.mutate({ text: nodeBody });
  };

  const handleContentStructurer = () => {
    if (!nodeBody.trim()) {
      toast.error("Please write something first");
      return;
    }
    structurerMutation.mutate({ text: nodeBody });
  };

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Accessibility AI</h3>
          <span className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
            Beta
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="express" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Express
            </TabsTrigger>
            <TabsTrigger value="classify" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              Classify
            </TabsTrigger>
            <TabsTrigger value="structure" className="text-xs">
              <Link2 className="w-3 h-3 mr-1" />
              Structure
            </TabsTrigger>
            <TabsTrigger value="purpose" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Purpose
            </TabsTrigger>
          </TabsList>

          <TabsContent value="express" className="space-y-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Help clarify and improve how you express your thoughts.
            </p>
            <Button
              onClick={handleExpressionAssistant}
              disabled={isLoading || !nodeBody.trim()}
              className="w-full"
              size="sm"
            >
              {expressionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Clarify Expression"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="classify" className="space-y-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Automatically suggest type, tags, and status for this content.
            </p>
            <Button
              onClick={handleAutoClassifier}
              disabled={isLoading || !nodeBody.trim()}
              className="w-full"
              size="sm"
            >
              {classifierMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Auto-Classify"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="structure" className="space-y-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Organize complex content into clear sections.
            </p>
            <Button
              onClick={handleContentStructurer}
              disabled={isLoading || !nodeBody.trim()}
              className="w-full"
              size="sm"
            >
              {structurerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Structure Content"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="purpose" className="space-y-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Identify the purpose of this content (task, reference, memory, etc).
            </p>
            <Button
              onClick={handlePurposeClarifier}
              disabled={isLoading || !nodeBody.trim()}
              className="w-full"
              size="sm"
            >
              {purposeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Identify Purpose"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              AI Suggestion ({result.provider}):
            </p>
            {result.type === "classification" ? (
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <div>
                  <strong>Type:</strong> {result.content.type}
                </div>
                <div>
                  <strong>Tags:</strong> {result.content.tags.join(", ") || "None suggested"}
                </div>
                <div>
                  <strong>Status:</strong> {result.content.suggestedStatus}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {typeof result.content === "string" ? result.content : JSON.stringify(result.content)}
              </div>
            )}
            {onApplySuggestion && (
              <Button onClick={() => onApplySuggestion(result)} size="sm" className="mt-2 w-full">
                Apply Suggestion
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
