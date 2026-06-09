import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import { BookOpen, Carrot, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { foods } from "@/data/foods"
import { reactionDisplay, reactionLabels, testDateTimeLabel } from "@/lib/formatting"
import { useBabyStore, type FoodTest } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { Header, EmptyState } from "@/components/primitives"
import { FoodEmoji } from "@/components/food/FoodEmoji"
import { FoodTestDrawer } from "@/components/food/FoodPanel"

const foodById = new Map(foods.map((food) => [food.id, food]))

// Journal chronologique des prises — portage de JournalView.swift.
export function JournalPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const [editing, setEditing] = useState<FoodTest | null>(null)
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string | null>(null)

  // store.tests est déjà trié du plus récent au plus ancien (sortTests).
  const entries = store.tests
    .map((test) => ({ test, food: foodById.get(test.foodId) }))
    .filter((entry): entry is { test: FoodTest; food: NonNullable<typeof entry.food> } => Boolean(entry.food))

  const editingFood = editing ? foodById.get(editing.foodId) : undefined

  useEffect(() => {
    if (!confirmingRemovalId) return
    const timeout = window.setTimeout(() => setConfirmingRemovalId(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [confirmingRemovalId])

  async function removeTest(test: FoodTest, foodName: string) {
    if (confirmingRemovalId !== test.id) {
      setConfirmingRemovalId(test.id)
      return
    }

    await store.deleteTest(test.id)
    toast.success(`${foodName} retiré du carnet`)
    setConfirmingRemovalId(null)
  }

  if (entries.length === 0) {
    return (
      <>
        <Header eyebrow="Carnet" title="Journal" />
        <EmptyState
          icon={BookOpen}
          title="Journal vide"
          action={
            <Button asChild variant="outline">
              <NavLink to="/foods">
                <Carrot data-icon="inline-start" aria-hidden="true" />
                Voir les aliments
              </NavLink>
            </Button>
          }
        >
          Les aliments ajoutés depuis le catalogue apparaîtront ici, jour après jour.
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <Header eyebrow="Carnet" title="Journal" />

      <ul className="grid gap-2">
        {entries.map(({ test, food }) => {
          const isConfirmingRemoval = confirmingRemovalId === test.id
          const reaction = reactionDisplay[test.reaction]

          return (
            <li
              key={test.id}
              className="flex items-center gap-2 rounded-card border bg-card/85 p-3 shadow-soft"
            >
              <button
                type="button"
                onClick={() => setEditing(test)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Modifier la prise de ${food.name} du ${testDateTimeLabel(test)}`}
              >
                <FoodEmoji food={food} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{food.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {testDateTimeLabel(test)}
                  </span>
                </span>
              </button>

              {test.reaction !== "Aucune" && (
                <span
                  className="shrink-0 text-lg leading-none"
                  title={reactionLabels[test.reaction]}
                  aria-label={`Réaction : ${reactionLabels[test.reaction]}`}
                >
                  {reaction.emoji}
                </span>
              )}

              <div className="flex shrink-0 items-center gap-1">
                {isConfirmingRemoval ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setConfirmingRemovalId(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs text-destructive"
                      onClick={() => void removeTest(test, food.name)}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Supprimer
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("size-9 text-muted-foreground hover:text-destructive")}
                    onClick={() => void removeTest(test, food.name)}
                    aria-label={`Retirer cette prise de ${food.name}`}
                    title="Retirer"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {editing && editingFood && (
        <FoodTestDrawer
          key={editing.id}
          food={editingFood}
          store={store}
          test={editing}
          initialTab="add"
          open
          onOpenChange={(next) => {
            if (!next) setEditing(null)
          }}
        />
      )}
    </>
  )
}
