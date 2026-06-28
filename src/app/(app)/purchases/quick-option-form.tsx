"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { fetchLinkPreview } from "@/app/actions/link-preview";
import { OPTION_SHAPES, OPTION_SHAPE_LABELS } from "@/lib/constants";
import { purchaseOptionSchema, type PurchaseOptionInput } from "@/lib/schemas";
import { addOption, getFuturePurchaseChoices, type FuturePurchaseChoice } from "./actions";

type Props = {
  trigger: React.ReactNode;
};

export function QuickOptionForm({ trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [fetching, setFetching] = React.useState(false);
  const [loadingPurchases, setLoadingPurchases] = React.useState(false);
  const [purchases, setPurchases] = React.useState<FuturePurchaseChoice[]>([]);
  const [purchaseId, setPurchaseId] = React.useState("");
  const [showDetails, setShowDetails] = React.useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PurchaseOptionInput>({
    resolver: zodResolver(purchaseOptionSchema),
    defaultValues: {
      name: "",
      store: "",
      url: "",
      price: 0,
      image_url: "",
      notes: "",
      rating: 0,
      frequency: "one-off",
      shape: "rectangle",
      width_cm: undefined,
      depth_cm: undefined,
      height_cm: undefined,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPurchases(true);
    getFuturePurchaseChoices().then((items) => {
      if (cancelled) return;
      setPurchases(items);
      setPurchaseId((current) => current || items[0]?.id || "");
      setLoadingPurchases(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedPurchase = purchases.find((p) => p.id === purchaseId);
  const isFurniture = selectedPurchase?.category === "Furniture";

  async function autofill() {
    const url = getValues("url");
    if (!url) return;
    setFetching(true);
    const res = await fetchLinkPreview(url);
    setFetching(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Couldn't auto-fill", description: res.error });
      return;
    }
    if (res.title && !getValues("name")) setValue("name", res.title.slice(0, 160));
    if (res.price) setValue("price", res.price);
    if (res.image) setValue("image_url", res.image);
    toast({ title: "Filled from link" });
  }

  function onSubmit(values: PurchaseOptionInput) {
    if (!purchaseId) {
      toast({ variant: "destructive", title: "Choose a purchase first" });
      return;
    }
    const payload = isFurniture
      ? values
      : { ...values, shape: undefined, width_cm: undefined, depth_cm: undefined, height_cm: undefined };
    startTransition(async () => {
      const result = await addOption(purchaseId, payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: "Option added", description: selectedPurchase ? `Added to ${selectedPurchase.name}.` : undefined });
      setOpen(false);
      reset();
      setShowDetails(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an option</DialogTitle>
          <DialogDescription>Add a product option to an existing future purchase.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Future purchase" required>
            <NativeSelect value={purchaseId} onChange={(e) => setPurchaseId(e.target.value)} disabled={loadingPurchases || !purchases.length}>
              {loadingPurchases ? <option>Loading...</option> : null}
              {!loadingPurchases && !purchases.length ? <option>No future purchases yet</option> : null}
              {purchases.map((purchase) => (
                <option key={purchase.id} value={purchase.id}>
                  {purchase.name}{purchase.room ? ` - ${purchase.room}` : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Option name" htmlFor="qo-name" required error={errors.name?.message}>
            <Input id="qo-name" placeholder="e.g. Oak sideboard from Made" {...register("name")} />
          </Field>
          <Field label="Price (£)" htmlFor="qo-price" error={errors.price?.message}>
            <Input id="qo-price" type="number" step="0.01" {...register("price")} />
          </Field>
          <Field label="Link (URL)" htmlFor="qo-url">
            <div className="flex gap-2">
              <Input id="qo-url" type="url" placeholder="https://..." {...register("url")} />
              <Button type="button" variant="outline" onClick={autofill} disabled={fetching} className="shrink-0">
                {fetching ? "..." : "Auto-fill"}
              </Button>
            </div>
          </Field>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            More details
            <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </button>

          {showDetails ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
              <Field label="Photo">
                <ImageUpload value={watch("image_url")} onChange={(url) => setValue("image_url", url ?? "")} />
                <input type="hidden" {...register("image_url")} />
              </Field>
              <Field label="Store" htmlFor="qo-store">
                <Input id="qo-store" placeholder="e.g. IKEA" {...register("store")} />
              </Field>
              {isFurniture ? (
                <div className="space-y-3 rounded-lg border bg-background/60 p-3">
                  <Field label="Shape" htmlFor="qo-shape">
                    <NativeSelect id="qo-shape" {...register("shape")}>
                      {OPTION_SHAPES.map((shape) => (
                        <option key={shape} value={shape}>{OPTION_SHAPE_LABELS[shape] ?? shape}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Width" htmlFor="qo-width" error={errors.width_cm?.message}>
                      <Input id="qo-width" type="number" step="1" min="0" placeholder="180" {...register("width_cm")} />
                    </Field>
                    <Field label="Depth" htmlFor="qo-depth" error={errors.depth_cm?.message}>
                      <Input id="qo-depth" type="number" step="1" min="0" placeholder="90" {...register("depth_cm")} />
                    </Field>
                    <Field label="Height" htmlFor="qo-height" error={errors.height_cm?.message}>
                      <Input id="qo-height" type="number" step="1" min="0" placeholder="75" {...register("height_cm")} />
                    </Field>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <input type="hidden" {...register("image_url")} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !purchaseId || !purchases.length}>
              {pending ? "Saving..." : "Add option"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
