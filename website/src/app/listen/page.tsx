import { ListenHeader } from "./ListenHeader";
import { HomeFeed } from "@/components/player/HomeFeed";

export default function ListenPage() {
  return (
    <>
      <ListenHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-40">
        <HomeFeed />
      </main>
    </>
  );
}
