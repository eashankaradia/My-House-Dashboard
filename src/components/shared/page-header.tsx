import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/shared/info-hint";

type Props = {
  title: string;
  description?: string;
  /** Optional how-to text shown in an info tooltip next to the title. */
  info?: string;
  children?: React.ReactNode;
  className?: string;
};

/** Standard page heading with an optional action slot on the right. */
export function PageHeader({ title, description, info, children, className }: Props) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {info ? <InfoHint text={info} /> : null}
        </div>
        {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{children}</div> : null}
    </div>
  );
}
