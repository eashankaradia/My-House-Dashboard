import { Camera, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { PrivatePhoto } from "@/lib/database.types";
import { PrivatePhotoDialog } from "./private-photo-dialog";
import { PrivatePhotosGrid } from "./private-photos-grid";

export const metadata = { title: "Private photos" };

export default async function PrivatePhotosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("private_photos").select("*").order("created_at", { ascending: false });
  const photos = (data ?? []) as PrivatePhoto[];

  const urlById: Record<string, string> = {};
  if (photos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrls(photos.map((p) => p.file_path), 3600);
    signed?.forEach((s, i) => {
      if (s.signedUrl) urlById[photos[i].id] = s.signedUrl;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Private photos"
        description="Photos only you can see — never shared with the household."
        info="Unlike Photos, nothing here is visible to other household members. Good for anything you'd rather keep to yourself — documents, IDs, whatever needs to stay private."
      >
        <PrivatePhotoDialog trigger={<Button className="gap-1.5"><Camera className="h-4 w-4" /> Photo</Button>} />
      </PageHeader>

      {photos.length === 0 ? (
        <EmptyState icon={Lock} title="No private photos yet" description="Snap or upload something you want to keep to yourself.">
          <PrivatePhotoDialog trigger={<Button className="gap-1.5"><Camera className="h-4 w-4" /> Take a photo</Button>} />
        </EmptyState>
      ) : (
        <PrivatePhotosGrid photos={photos} urlById={urlById} />
      )}
    </div>
  );
}
