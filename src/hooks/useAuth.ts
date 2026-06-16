import { useMemo } from "react";
import { db, useDB } from "../lib/store";

export function useAuth() {
  const currentUserId = useDB((s) => s.currentUserId);
  const profile = useDB((s) => {
    if (!s.currentUserId) return null;
    return s.profiles.find((p) => p.id === s.currentUserId) ?? null;
  });

  return useMemo(
    () => ({
      isAuthed: !!currentUserId,
      userId: currentUserId,
      profile,
      me: db.ME_ID,
    }),
    [currentUserId, profile?.id]
  );
}
