import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Timeline() {
  const { user } = useAuth();
  const { data: nodes = [] } = trpc.nodes.list.useQuery({}, { enabled: !!user });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Get time blocks for selected date
  const timeBlocks = nodes.filter(n => {
    if (!n.startTime) return false;
    const blockDate = n.startTime.split("T")[0];
    return blockDate === selectedDate;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <DashboardLayout>
      <div className="space-generous">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Time Blocking</h1>
            <p className="text-calm mt-2">Visual daily timeline for scheduling</p>
          </div>
          <Link href="/node/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Time Block
            </Button>
          </Link>
        </div>

        {/* Date Selector */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            />
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>

          <div className="space-y-1 border-l-2 border-soft pl-4">
            {hours.map(hour => {
              const hourStr = String(hour).padStart(2, "0");
              const blockInHour = timeBlocks.find(b => {
                const blockHour = new Date(b.startTime!).getHours();
                return blockHour === hour;
              });

              return (
                <div key={hour} className="relative">
                  <div className="text-xs text-calm font-medium mb-1">{hourStr}:00</div>
                  {blockInHour ? (
                    <Card className="shadow-calm bg-accent/5 border-accent/20">
                      <CardContent className="pt-3">
                        <p className="text-sm font-medium">{blockInHour.body}</p>
                        <p className="text-xs text-calm mt-1">
                          {new Date(blockInHour.startTime!).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {blockInHour.endTime &&
                            ` - ${new Date(blockInHour.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-12 bg-soft/20 rounded border border-dashed border-soft/50 flex items-center justify-center">
                      <span className="text-xs text-calm">Empty</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <Card className="bg-soft/30 border-soft">
          <CardContent className="pt-4">
            <p className="text-sm text-calm">
              💡 Time blocks are nodes too! Link them to tasks, projects, or people to see how your schedule connects to your goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
