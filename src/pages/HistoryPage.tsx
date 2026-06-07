import { useState, useEffect, useMemo } from "react"
import { BadgeCheck, NotebookText, PencilLine, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { foods, type Food } from "@/data/foods"
import { useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { reactionLabels, historyDateLabel, historyDateDetailLabel, historyEventTimeParts, groupTestsByDate } from "@/lib/formatting"
import { useAppOptions } from "@/app/AppOptions"
import { AnimatedList, AnimatedListItem, EmptyState, Header } from "@/components/primitives"
import { FoodEmoji } from "@/components/food/FoodEmoji"
import { PopoteBadge } from "@/components/food/FoodBadges"
import { FoodTestDrawer } from "@/components/food/FoodPanel"

export function HistoryPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const { activePopotePackId } = useAppOptions()
  const historyGroups = useMemo(() => groupTestsByDate(store.tests), [store.tests])

  return (
    <>
      <Header eyebrow="Journal" title="Historique" />
      {store.tests.length === 0 ? (
        <EmptyState icon={NotebookText} title="Journal encore vide">
          Les tests ajoutés apparaîtront ici par ordre récent, avec vos notes et réactions.
        </EmptyState>
      ) : (
        <AnimatedList className="grid gap-5">
          {historyGroups.map((group) => (
            <AnimatedListItem key={group.date} className="grid gap-3">
              <div className="px-1">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-foreground">{historyDateLabel(group.date)}</h2>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{historyDateDetailLabel(group.date)}</p>
                </div>
              </div>
              <div className="relative grid gap-3">
                <span className="absolute bottom-4 left-[4.5rem] top-4 w-px bg-border" aria-hidden="true" />
                {group.tests.map((test) => {
                  const food = foods.find((item) => item.id === test.foodId)
                  if (!food) return null
                  const status = test.reaction === "aucune réaction" ? "testé" : "réaction"
                  const time = historyEventTimeParts(test)

                  return (
                    <div key={test.id} className="relative grid grid-cols-[4rem_minmax(0,1fr)] gap-3">
                      <div className="pt-4 text-right">
                        <p className="text-sm font-semibold leading-none text-foreground">{time.time}</p>
                        {time.moment && (
                          <p className="mt-1 truncate text-[0.6875rem] font-medium leading-none text-muted-foreground">
                            {time.moment}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "absolute left-[4.125rem] top-5 size-3 rounded-full border-2 border-background shadow-sm",
                          status === "réaction" ? "bg-status-reaction" : "bg-status-tested",
                        )}
                        aria-hidden="true"
                      />
                      <Card
                        className={cn(
                          "paper-surface overflow-hidden border-border/60",
                          status === "réaction" && "border-status-reaction/35 bg-status-reaction/10",
                        )}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <FoodEmoji food={food} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-foreground">{food.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{food.category}</p>
                              </div>
                            </div>
                            <HistoryTestActions food={food} store={store} test={test} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <HistoryReactionBadge reaction={test.reaction} />
                            {activePopotePackId !== null && test.isPopote && <PopoteBadge />}
                          </div>
                          {test.note && (
                            <p className="mt-3 rounded-lg border border-border/60 bg-muted/55 p-3 text-sm leading-5">
                              {test.note}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}
    </>
  )
}

export function HistoryReactionBadge({ reaction }: { reaction: Reaction }) {
  if (reaction === "aucune réaction") {
    return (
      <Badge className="h-8 gap-1.5 border-transparent bg-status-tested px-3 text-status-tested-foreground">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        RAS
      </Badge>
    )
  }

  return (
    <Badge className="h-8 gap-1.5 border-transparent bg-status-reaction px-3 text-status-reaction-foreground">
      <Sparkles className="size-3.5" aria-hidden="true" />
      {reactionLabels[reaction]}
    </Badge>
  )
}

export function HistoryTestActions({
  food,
  store,
  test,
}: {
  food: Food
  store: ReturnType<typeof useBabyStore>
  test: FoodTest
}) {
  const [open, setOpen] = useState(false)
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)

  async function removeTest() {
    if (!confirmingRemoval) {
      setConfirmingRemoval(true)
      return
    }

    await store.deleteTest(test.id)
    toast.success(`${food.name} retiré du journal`)
    setConfirmingRemoval(false)
  }

  useEffect(() => {
    if (!confirmingRemoval) return
    const timeout = window.setTimeout(() => setConfirmingRemoval(false), 3500)
    return () => window.clearTimeout(timeout)
  }, [confirmingRemoval])

  return (
    <>
      <div className="flex min-h-11 items-center justify-end gap-1">
        {confirmingRemoval ? (
          <>
            <Button type="button" variant="ghost" size="sm" className="h-11" onClick={() => setConfirmingRemoval(false)}>
              Annuler
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-11 text-destructive" onClick={removeTest}>
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              Confirmer
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(true)}
              aria-label={`Modifier le test de ${food.name}`}
              title="Modifier"
            >
              <PencilLine aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground hover:text-destructive"
              onClick={removeTest}
              aria-label={`Retirer ${food.name} du journal`}
              title="Retirer"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
      {open && <FoodTestDrawer food={food} store={store} test={test} open={open} onOpenChange={setOpen} />}
    </>
  )
}
