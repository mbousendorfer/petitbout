import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { foods } from "@/data/foods"
import { calculateBadges, readBadgeUnlockDates, writeBadgeUnlockDates, type BadgeUnlockDates } from "@/lib/gamification"
import { useBabyStore } from "@/lib/storage"

export function useBadgeUnlockDates(
  tests: ReturnType<typeof useBabyStore>["tests"],
  syncStatus: ReturnType<typeof useBabyStore>["syncStatus"],
) {
  const [unlockDates, setUnlockDates] = useState<BadgeUnlockDates>(() => readBadgeUnlockDates())
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
      newlyUnlocked.slice(0, 3).forEach((badge) => {
        toast.success(`Badge débloqué : ${badge.title}`)
      })
    }

    hasCheckedExistingBadges.current = true
  }, [syncStatus, tests, unlockDates])

  return unlockDates
}
