"use client";

import * as React from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logHabitDuration } from "./actions";

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** A simple start/pause/stop timer for timer-type habits. Stopping logs the elapsed time. */
export function HabitTimer({ habitId, onLogged }: { habitId: string; onLogged?: () => void }) {
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  function stop() {
    setRunning(false);
    if (seconds === 0) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      const r = await logHabitDuration(habitId, todayStr, seconds, { add: true });
      if (r?.error) {
        toast({ variant: "destructive", title: "Couldn't log time", description: r.error });
        return;
      }
      toast({ title: `Logged ${fmt(seconds)}` });
      setSeconds(0);
      onLogged?.();
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <span className="font-mono text-2xl font-semibold tabular-nums">{fmt(seconds)}</span>
      <div className="flex gap-1.5">
        {!running ? (
          <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => setRunning(true)}>
            <Play className="h-4 w-4" /> {seconds > 0 ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => setRunning(false)}>
            <Pause className="h-4 w-4" /> Pause
          </Button>
        )}
        <Button type="button" size="sm" variant="default" className="gap-1.5" disabled={pending || seconds === 0} onClick={stop}>
          <Square className="h-3.5 w-3.5" /> Stop & log
        </Button>
      </div>
    </div>
  );
}
