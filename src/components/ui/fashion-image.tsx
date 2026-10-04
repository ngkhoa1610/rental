"use client";

import Image, { type ImageProps } from "next/image";
import { useLanguage } from "@/components/store/language-provider";
import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Keep the reserved image geometry and useful alt text when an asset fails. */
export function FashionImage(props: ImageProps) {
  const { t } = useLanguage();
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  if (failedSource === props.src) {
    return (
      <span
        className="image-fallback"
        role="img"
        aria-label={`${t(props.alt)}. ${t("Image unavailable")}.`}
      >
        <ImageOff aria-hidden="true" />
        <span>{t("Image unavailable")}</span>
      </span>
    );
  }
  return (
    <Image
      {...props}
      alt={t(props.alt)}
      onError={() => setFailedSource(props.src)}
    />
  );
}
