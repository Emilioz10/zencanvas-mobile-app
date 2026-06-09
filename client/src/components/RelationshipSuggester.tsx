import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface SuggestedLink {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  fromLabel: string;
  toLabel: string;
  type: string;
  confidence: number;
  reasoning: string;
}

export function RelationshipSuggester() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const { data: pendingSuggestions } = trpc.suggestions.getPending.useQuery(
    undefined,
    { enabled: !!user }
  );

  const acceptMutation = trpc.suggestions.accept.useMutation();
  const rejectMutation = trpc.suggestions.reject.useMutation();

  useEffect(() => {
    if (pendingSuggestions && pendingSuggestions.length > 0) {
      // Transform suggestions to display format
      const displaySuggestions: SuggestedLink[] = pendingSuggestions.map((s, idx) => ({
        id: s.id,
        fromNodeId: s.fromNodeId,
        toNodeId: s.toNodeId,
        fromLabel: `Node ${s.fromNodeId}`,
        toLabel: `Node ${s.toNodeId}`,
        type: s.type,
        confidence: Math.round((s.confidence || 0) * 100),
        reasoning: s.reason || "AI detected a potential connection",
      }));
      setSuggestions(displaySuggestions);
    }
  }, [pendingSuggestions]);

  const handleAccept = async (suggestion: SuggestedLink) => {
    try {
      await acceptMutation.mutateAsync({ suggestionId: suggestion.id });
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      setProcessedCount(processedCount + 1);
      toast.success("Relationship created");
    } catch (error) {
      toast.error("Failed to accept suggestion");
    }
  };

  const handleReject = async (suggestion: SuggestedLink) => {
    try {
      await rejectMutation.mutateAsync({ suggestionId: suggestion.id });
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      setProcessedCount(processedCount + 1);
      toast.success("Suggestion dismissed");
    } catch (error) {
      toast.error("Failed to reject suggestion");
    }
  };

  if (suggestions.length === 0 && processedCount === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Smart Relationship Suggestions
          </CardTitle>
          <CardDescription>
            AI analyzes your nodes to suggest missing connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-calm text-sm">
              No suggestions yet. Create more nodes to discover hidden connections.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0 && processedCount > 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Smart Relationship Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-calm text-sm">
              Great! You've reviewed {processedCount} suggestion{processedCount !== 1 ? "s" : ""}. AI will find more connections as you add nodes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Smart Relationship Suggestions
        </CardTitle>
        <CardDescription>
          {suggestions.length} potential connection{suggestions.length !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 border border-soft rounded-lg space-y-3 hover:bg-soft/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{suggestion.fromLabel}</span>
                  <span className="text-calm text-xs">→</span>
                  <span className="text-sm font-medium">{suggestion.toLabel}</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      suggestion.confidence > 75
                        ? "bg-green-50 text-green-700"
                        : suggestion.confidence > 50
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {suggestion.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-xs text-calm">{suggestion.reasoning}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(suggestion)}
                disabled={rejectMutation.isPending}
                className="gap-1"
              >
                <X className="w-3 h-3" />
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(suggestion)}
                disabled={acceptMutation.isPending}
                className="gap-1"
              >
                {acceptMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                <Check className="w-3 h-3" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
