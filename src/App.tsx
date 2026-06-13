import { lazy, Suspense, useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

import { PwaStatus } from "@/components/PwaStatus"
import { Toaster } from "@/components/ui/sonner"
import { BadgeUnlockCelebration } from "@/components/BadgeUnlockCelebration"
import { BottomNav, DesktopNav } from "@/components/Navigation"
import { PageLoading } from "@/components/primitives"
import { HomePage } from "@/pages/HomePage"
import { FoodsPage } from "@/pages/FoodsPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { useTheme } from "@/app/useTheme"
import { useBadgeUnlockDates } from "@/app/useBadgeUnlockDates"
import { foods } from "@/data/foods"
import { weeklySuggestions } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"

const DiscoveriesPage = lazy(() =>
  import("@/components/DiscoveriesPage").then((module) => ({ default: module.DiscoveriesPage })),
)

const GuidancePage = lazy(() =>
  import("@/components/GuidancePage").then((module) => ({ default: module.GuidancePage })),
)

const JournalPage = lazy(() =>
  import("@/pages/JournalPage").then((module) => ({ default: module.JournalPage })),
)

const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })),
)

const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
)

const FeedbackPage = lazy(() =>
  import("@/pages/FeedbackPage").then((module) => ({ default: module.FeedbackPage })),
)

const DataPrivacyPage = lazy(() =>
  import("@/pages/DataPrivacyPage").then((module) => ({ default: module.DataPrivacyPage })),
)

const PrivacyPage = lazy(() =>
  import("@/pages/PrivacyPage").then((module) => ({ default: module.PrivacyPage })),
)

const FamilySpacePage = lazy(() =>
  import("@/pages/FamilySpacePage").then((module) => ({ default: module.FamilySpacePage })),
)

function App() {
  const store = useBabyStore()
  useScrollToTopOnRoute(store.familySession?.familyCodeHash ?? "")
  const [theme, setTheme] = useTheme()
  const {
    celebrationBadge,
    dismissBadgeCelebration,
    unlockDates: badgeUnlockDates,
  } = useBadgeUnlockDates(store.tests, store.syncStatus)
  const suggestions = weeklySuggestions(foods, store.profile.ageMonths, store.testedFoodIds)

  if (!store.hasCompletedOnboarding) {
    return (
      <div className="safe-shell soft-surface">
        <main className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-5 sm:px-6">
          <PwaStatus />
          <OnboardingPage store={store} />
        </main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="safe-shell soft-surface lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <DesktopNav />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:px-6 lg:mx-0 lg:max-w-6xl lg:px-0 lg:py-8">
          <PwaStatus />
          <Routes>
            <Route path="/" element={<HomePage store={store} suggestions={suggestions} />} />
            <Route path="/foods" element={<FoodsPage store={store} />} />
            <Route path="/week" element={<Navigate to="/" replace />} />
            <Route path="/history" element={<Navigate to="/" replace />} />
            <Route
              path="/guidance"
              element={
                <Suspense fallback={<PageLoading label="Repères" />}>
                  <GuidancePage ageMonths={store.profile.ageMonths} childName={store.profile.childName} />
                </Suspense>
              }
            />
            <Route
              path="/discoveries"
              element={
                <Suspense fallback={<PageLoading label="Progression" />}>
                  <DiscoveriesPage
                    tests={store.tests}
                    badgeUnlockDates={badgeUnlockDates}
                    childName={store.profile.childName}
                    avatarEmoji={store.profile.avatarEmoji}
                  />
                </Suspense>
              }
            />
            <Route
              path="/journal"
              element={
                <Suspense fallback={<PageLoading label="Journal" />}>
                  <JournalPage store={store} />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<PageLoading label="Réglages" />}>
                  <SettingsPage store={store} theme={theme} setTheme={setTheme} />
                </Suspense>
              }
            />
            <Route
              path="/feedback"
              element={
                <Suspense fallback={<PageLoading label="Feedback" />}>
                  <FeedbackPage />
                </Suspense>
              }
            />
            <Route
              path="/data-privacy"
              element={
                <Suspense fallback={<PageLoading label="Données" />}>
                  <DataPrivacyPage store={store} />
                </Suspense>
              }
            />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={<PageLoading label="Confidentialité" />}>
                  <PrivacyPage />
                </Suspense>
              }
            />
            <Route
              path="/family-space"
              element={
                <Suspense fallback={<PageLoading label="Espace famille" />}>
                  <FamilySpacePage store={store} />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<PageLoading label="Profil de bébé" />}>
                  <ProfilePage store={store} />
                </Suspense>
              }
            />
          </Routes>
        </main>
        <BottomNav />
        <BadgeUnlockCelebration badge={celebrationBadge} onDismiss={dismissBadgeCelebration} />
        <Toaster />
      </div>
  )
}

function useScrollToTopOnRoute(sessionKey: string) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, sessionKey])
}

export default App
