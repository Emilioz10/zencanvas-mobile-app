import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardCanvas } from "@/components/CardCanvas";
import { GraphFilter } from "@/components/GraphFilter";

export default function Canvas() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [visibleTypes, setVisibleTypes] = useState<string[]>([
    "task", "note", "project", "person", "event", "idea",
  ]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-soft flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{t("nav.canvas")}</h1>
            <p className="text-calm text-sm mt-0.5">
              גרור כרטיסיות · חבר ידיות ליצירת קישורים · לחץ לעריכה
            </p>
          </div>
          <div className="flex gap-2">
            <GraphFilter onFilterChange={setVisibleTypes} />
            <Link href="/node/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("common.add")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Canvas — full remaining height */}
        <div style={{ flex: 1, minHeight: 0, borderRadius: 12, overflow: "hidden", marginTop: 12, border: "1px solid #e2e8f0" }}>
          <CardCanvas visibleTypes={visibleTypes} />
        </div>
      </div>
    </DashboardLayout>
  );
}
