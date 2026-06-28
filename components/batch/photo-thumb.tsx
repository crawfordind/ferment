"use client";

import { useState } from "react";

import { usePhotoSrc } from "@/hooks/use-photos";
import { cn } from "@/lib/utils";

import { PhotoPlaceholder } from "./photo-placeholder";

export function PhotoThumb({
  photoId,
  className,
  grayscale = false,
  alt = "",
}: {
  photoId?: string | null;
  className?: string;
  grayscale?: boolean;
  alt?: string;
}) {
  const src = usePhotoSrc(photoId);
  const [errored, setErrored] = useState(false);

  if (!photoId || !src || errored) {
    return <PhotoPlaceholder className={className} grayscale={grayscale} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob/R2 object URLs, not static assets
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={cn("object-cover", grayscale && "grayscale", className)}
    />
  );
}
