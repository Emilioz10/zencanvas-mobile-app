import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DataBackup() {
  const { t } = useTranslation();
  const { data: nodes } = trpc.nodes.list.useQuery({ type: undefined, status: undefined });
  const { data: relationships } = trpc.relationships.forNode.useQuery({ nodeId: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Collect all data
      const allNodes = nodes || [];
      const relArray = relationships?.outgoing?.length ? [...(relationships.outgoing || []), ...(relationships.incoming || [])] : [];
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        nodes: allNodes,
        relationships: relArray,
        stats: {
          totalNodes: allNodes.length,
          totalRelationships: relArray.length,
        },
      };

      // Create JSON file
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `zencanvas-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup format
      if (!backupData.version || !Array.isArray(backupData.nodes)) {
        toast.error(t('common.error'));
        return;
      }

      // Show import summary
      toast.success(
        `Ready to import ${backupData.stats?.totalNodes || 0} nodes and ${
          backupData.stats?.totalRelationships || 0
        } relationships`
      );

      // In a real app, you would import the data here
      // For now, just show the summary
      console.log("Backup data:", backupData);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">{t('settings.dataBackup')}</h3>

      <div className="grid grid-cols-2 gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('settings.export')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.export')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-calm">
                {t('common.add')}
              </p>
              <ul className="text-sm text-calm list-disc list-inside space-y-1">
                <li>{t('common.add')}</li>
                <li>{t('common.add')}</li>
                <li>{t('common.add')}</li>
                <li>{t('common.add')}</li>
              </ul>
              <Button onClick={handleExport} disabled={isExporting} className="w-full">
                {isExporting ? t('common.loading') : t('settings.export')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t('settings.import')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.import')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-calm">
                {t('common.add')}
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  variant="outline"
                  className="w-full"
                >
                  {isImporting ? "Importing..." : "Select Backup File"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Only JSON files exported from ZenCanvas are supported
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Export your data regularly to create local backups. Your data is also automatically
          backed up on Manus servers.
        </p>
      </div>
    </Card>
  );
}
