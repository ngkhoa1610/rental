"use client";

import { FashionImage } from "@/components/ui/fashion-image";
import { Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Shows the supplied photo only; do not invent alternate product views. */
export function ProductGallery({
  image,
  alt,
  name,
}: {
  image: string;
  alt: string;
  name: string;
}) {
  return (
    <Sheet>
      <figure className="store-detail-photo">
        <FashionImage
          src={image}
          alt={alt}
          fill
          preload
          sizes="(max-width: 1023px) 100vw, 560px"
        />
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="store-image-expand"
            aria-label={`View full image of ${name}`}
          >
            <Expand aria-hidden="true" />
            View full image
          </Button>
        </SheetTrigger>
        <figcaption>Styling inspiration · 1 temporary image</figcaption>
      </figure>
      <SheetContent
        side="bottom"
        className="store-image-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="pr-16">
          <SheetTitle>{name}</SheetTitle>
          <SheetDescription>
            Editorial inspiration, not confirmed inventory photography.
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            className="absolute right-3 top-3 size-11"
            aria-label="Close image"
          >
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
        <div className="store-full-image">
          <FashionImage
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 1023px) 100vw, 960px"
            className="object-contain"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
