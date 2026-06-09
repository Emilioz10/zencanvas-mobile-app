import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { markdownToHtml, extractNodeReferences } from "@/lib/markdown";
import { Eye, Code } from "lucide-react";


interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  onNodeReferencesChange?: (references: string[]) => void;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your note in Markdown...",
  dir = "ltr",
  onNodeReferencesChange,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState<string>("");
  const [nodeRefs, setNodeRefs] = useState<string[]>([]);

  useEffect(() => {
    const html = markdownToHtml(value);
    setPreview(html);

    const refs = extractNodeReferences(value);
    setNodeRefs(refs);

    if (onNodeReferencesChange) {
      onNodeReferencesChange(refs);
    }
  }, [value, onNodeReferencesChange]);

  return (
    <div className="w-full space-y-3" dir={dir}>
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="gap-2">
            <Code className="w-4 h-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-64 font-mono text-sm"
            dir={dir}
          />

          <div className="text-xs text-calm space-y-2 p-3 bg-soft/30 rounded-lg">
            <p className="font-semibold">Markdown Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Wikilinks:</strong> <code>[[Node Title]]</code> to link to other nodes
              </li>
              <li>
                <strong>Callouts:</strong> <code>&gt; [!NOTE]</code>, <code>&gt; [!WARNING]</code>
              </li>
              <li>
                <strong>Tables:</strong> Use standard Markdown table syntax
              </li>
              <li>
                <strong>Task Lists:</strong> <code>- [ ]</code> and <code>- [x]</code>
              </li>
              <li>
                <strong>Code:</strong> Use backticks or triple backticks for blocks
              </li>
            </ul>
          </div>

          {nodeRefs.length > 0 && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">Linked Nodes:</p>
              <div className="flex flex-wrap gap-2">
                {nodeRefs.map((ref) => (
                  <span
                    key={ref}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-3">
          <Card className="p-4 min-h-64 prose prose-sm dark:prose-invert max-w-none">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
