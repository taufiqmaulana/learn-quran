import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PlaceholderBadge } from "../components/PlaceholderBadge";
import { LessonPlayer } from "../features/lesson/LessonPlayer";
import { MapPage } from "../features/map/MapPage";
import { PracticePage } from "../features/practice/PracticePage";
import { useProgress } from "../lib/progress";

/** Progress loads asynchronously from IndexedDB; wait so lock checks see real data. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useProgress.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useProgress.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useProgress.persist.hasHydrated());
    return unsub;
  }, [hydrated]);
  return hydrated;
}

export function App() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/jilid/:jilid/lesson/:id" element={<LessonPlayer />} />
        <Route path="/latihan/:id" element={<PracticePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PlaceholderBadge />
    </BrowserRouter>
  );
}
