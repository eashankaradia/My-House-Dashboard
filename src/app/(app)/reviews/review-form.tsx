"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import type { Review, ReviewPeriod } from "@/lib/database.types";
import { upsertReview } from "./actions";

const PROMPTS: Record<ReviewPeriod, { wentWell: string; stuck: string; stopDoing: string; priorities: string }> = {
  weekly: {
    wentWell: "What went well this week?",
    stuck: "What's stuck, or needs moving?",
    stopDoing: "What should you stop doing?",
    priorities: "Priorities for next week",
  },
  monthly: {
    wentWell: "What went well this month? (money, fitness, goals, home)",
    stuck: "What's stuck, or fell behind?",
    stopDoing: "What should you stop doing?",
    priorities: "Priorities for next month",
  },
};

export function ReviewForm({
  periodType,
  periodStart,
  existing,
}: {
  periodType: ReviewPeriod;
  periodStart: string;
  existing?: Review;
}) {
  const [wentWell, setWentWell] = React.useState(existing?.went_well ?? "");
  const [stuck, setStuck] = React.useState(existing?.stuck ?? "");
  const [stopDoing, setStopDoing] = React.useState(existing?.stop_doing ?? "");
  const [priorities, setPriorities] = React.useState(existing?.priorities ?? "");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const prompts = PROMPTS[periodType];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await upsertReview(periodType, periodStart, {
        went_well: wentWell,
        stuck,
        stop_doing: stopDoing,
        priorities,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: res.error });
        return;
      }
      toast({ title: "Review saved" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={prompts.wentWell}>
        <Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={3} />
      </Field>
      <Field label={prompts.stuck}>
        <Textarea value={stuck} onChange={(e) => setStuck(e.target.value)} rows={3} />
      </Field>
      <Field label={prompts.stopDoing}>
        <Textarea value={stopDoing} onChange={(e) => setStopDoing(e.target.value)} rows={2} />
      </Field>
      <Field label={prompts.priorities}>
        <Textarea value={priorities} onChange={(e) => setPriorities(e.target.value)} rows={3} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save review"}
      </Button>
    </form>
  );
}
