"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Keep the reserved image geometry and useful alt text when an asset fails. */
export function FashionImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  if (failedSource === props.src) {
    return (
      <span
        className="image-fallback"
        role="img"
        aria-label={`${props.alt}. Image unavailable.`}
      >
        <ImageOff aria-hidden="true" />
        <span>Image unavailable</span>
      </span>
    );
  }
  return (
    <Image
      {...props}
      alt={props.alt}
      onError={() => setFailedSource(props.src)}
    />
  );
}
