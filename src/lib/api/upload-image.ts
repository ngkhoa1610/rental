export async function uploadImage(
  file: File,
  csrfToken: string | null,
  orderId?: string,
): Promise<string> {
  if (!csrfToken) throw new Error("Please sign in again.");
  if (file.size > 4194304) throw new Error("Each photo must be at most 4 MB.");
  const response = await fetch(
      orderId ? "/api/v1/me/reviews/media" : "/api/v1/admin/products/media",
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": file.type,
          "X-CSRF-Token": csrfToken,
          ...(orderId ? { "X-Order-Id": orderId } : {}),
        },
        body: file,
        signal: AbortSignal.timeout(20000),
      },
    ),
    result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message ?? "Unable to upload photo.");
  if (
    typeof result.data?.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(result.data.id)
  )
    throw new Error("The service returned an invalid response.");
  return result.data.id;
}
