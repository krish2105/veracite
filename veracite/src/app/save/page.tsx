import { Suspense } from "react";
import { parseSaveParams } from "@/lib/library/bookmarklet";
import { SaveView } from "./SaveView";

export const metadata = { title: "Veracite · Save a source" };

/**
 * /save?doi=… or /save?url=…&title=… (A15, built in K27): verify first, then the student may add it.
 * Cache Components: the search params are read inside <Suspense>, so the shell still prerenders.
 */
export default function Page({ searchParams }: PageProps<"/save">) {
  return (
    <Suspense fallback={<SaveView target={{ kind: "none" }} pending />}>
      <FromParams searchParams={searchParams} />
    </Suspense>
  );
}

async function FromParams({ searchParams }: Pick<PageProps<"/save">, "searchParams">) {
  return <SaveView target={parseSaveParams(await searchParams)} />;
}
