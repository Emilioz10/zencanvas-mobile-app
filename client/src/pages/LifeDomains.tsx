import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";

const DEFAULT_DOMAINS = [
  { name: "Health & Wellness", color: "#10b981", icon: "🏥" },
  { name: "Relationships", color: "#ec4899", icon: "👥" },
  { name: "Finance", color: "#f59e0b", icon: "💰" },
  { name: "Work & Career", color: "#3b82f6", icon: "💼" },
  { name: "Personal Growth", color: "#8b5cf6", icon: "🌱" },
  { name: "Education", color: "#06b6d4", icon: "📚" },
  { name: "Hobbies & Interests", color: "#f97316", icon: "🎨" },
  { name: "Home & Family", color: "#6366f1", icon: "🏠" },
];

export default function LifeDomains() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: domains, isLoading } = trpc.lifeDomains.list.useQuery();
  const createMutation = trpc.lifeDomains.create.useMutation();

  const [newDomain, setNewDomain] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (!newDomain.trim()) {
      toast.error(t('common.error'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: newDomain,
        color: selectedColor,
      });
      toast.success(t('common.success'));
      setNewDomain("");
      setSelectedColor("#6366f1");
      setIsOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">{t('nav.domains')}</h1>
            <p className="text-calm mt-2">
              {t('common.add')}
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>{t('common.add')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('common.create')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('common.add')}</Label>
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder={t('common.add')}
                  />
              </div>

              <div>
                <Label>{t('common.edit')}</Label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    "#10b981",
                    "#ec4899",
                    "#f59e0b",
                    "#3b82f6",
                    "#8b5cf6",
                    "#06b6d4",
                    "#f97316",
                    "#6366f1",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? "border-gray-800" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Domain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Domains */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Suggested Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_DOMAINS.map((domain) => (
            <Card key={domain.name} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">{domain.icon}</div>
              <h3 className="font-semibold text-lg">{domain.name}</h3>
              <div
                className="w-full h-2 rounded-full mt-4"
                style={{ backgroundColor: domain.color }}
              />
            </Card>
          ))}
        </div>
      </div>

      {/* User Created Domains */}
      {domains && domains.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Domains</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {domains.map((domain: any) => (
              <Card key={domain.id} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg">{domain.name}</h3>
                {domain.description && <p className="text-sm text-gray-600 mt-2">{domain.description}</p>}
                <div
                  className="w-full h-2 rounded-full mt-4"
                  style={{ backgroundColor: domain.color }}
                />
              </Card>
            ))}
          </div>
        </div>
      )}

        {/* Info Section */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-lg mb-2">{t('common.add')}</h3>
          <p className="text-calm">
            {t('common.add')}
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
