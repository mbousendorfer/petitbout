import { useState, useEffect, useRef, useCallback, useReducer } from "react"
import { foods } from "@/data/foods"
import {
  calculateBadges,
  readBadgeUnlockDates,
  writeBadgeUnlockDates,
  type BadgeUnlockDates,
  type DiscoveryBadge,
} from "@/lib/gamification"
import { useBabyStore } from "@/lib/storage"

export function useBadgeUnlockDates(
  tests: ReturnType<typeof useBabyStore>["tests"],
  syncStatus: ReturnType<typeof useBabyStore>["syncStatus"],
) {
  const [unlockDates, setUnlockDates] = useReducer(
    (_current: BadgeUnlockDates, next: BadgeUnlockDates) => next,
    undefined,
    readBadgeUnlockDates,
  )
  const [celebrationQueue, setCelebrationQueue] = useState<DiscoveryBadge[]>([])
  const hasCheckedExistingBadges = useRef(false)

  useEffect(() => {
    if (syncStatus === "loading") return

    const badges = calculateBadges(foods, tests, unlockDates)
    const newlyUnlocked = badges.filter((badge) => badge.unlocked && !unlockDates[badge.id])

    if (newlyUnlocked.length === 0) {
      hasCheckedExistingBadges.current = true
      return
    }

    const unlockedAt = new Date().toISOString()
    const nextUnlockDates = { ...unlockDates }
    newlyUnlocked.forEach((badge) => {
      nextUnlockDates[badge.id] = unlockedAt
    })

    setUnlockDates(nextUnlockDates)
    writeBadgeUnlockDates(nextUnlockDates)

    if (hasCheckedExistingBadges.current) {
      setCelebrationQueue((currentQueue) => [...currentQueue, ...newlyUnlocked.slice(0, 3)])
    }

    hasCheckedExistingBadges.current = true
  }, [syncStatus, tests, unlockDates])

  const dismissBadgeCelebration = useCallback(function dismissBadgeCelebration() {
    setCelebrationQueue((currentQueue) => currentQueue.slice(1))
  }, [])

  return {
    celebrationBadge: celebrationQueue[0] ?? null,
    dismissBadgeCelebration,
    unlockDates,
  }
}
