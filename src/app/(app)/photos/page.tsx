import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { QuickPhoto } from "@/lib/database.types";
import { PhotosGrid } from "./photos-grid";
import { QuickPhotoDialog } from "./quick-photo-dialog";

export const metadata = { title: "Photos" };

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("quick_photos").select("*").order("created_at", { ascending: false });
  const photos = (data ?? []) as QuickPhoto[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photos"
        description="A shoebox for quick snaps to sort out later."
        info="Use the + button (or the Photo button here) to snap something — a serial number, a paint tin, a measurement — and label it whenever you get round to it."
      >
        <QuickPhotoDialog trigger={<Button className="gap-1.5"><Camera className="h-4 w-4" /> Photo</Button>} />
      </PageHeader>

      {photos.length === 0 ? (
        <EmptyState icon={Camera} title="No photos yet" description="Snap something now and label it later — it'll appear here.">
          <QuickPhotoDialog trigger={<Button className="gap-1.5"><Camera className="h-4 w-4" /> Take a photo</Button>} />
        </EmptyState>
      ) : (
        <PhotosGrid photos={photos} />
      )}
    </div>
  );
}
