import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router-dom"
import { ArrowLeft, Download, Lock, Plus, RotateCcw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Header, PageLoading } from "@/components/primitives"
import {
  type CatalogRecord,
  catalogColumns,
  foodFromRecord,
  rawCatalogRows,
  serializeCatalog,
} from "@/data/foods"
import { saveTextFile } from "@/lib/formatting"
import { useAdminAccess } from "@/lib/admin"
import { cn } from "@/lib/utils"

const draftKey = "petitbout-admin-catalog-draft"
const emptySelectValue = "·none·"

const categoryOptions: Array<[string, string]> = [
  ["vegetable", "Légumes"],
  ["fruit", "Fruits"],
  ["starch", "Féculents"],
  ["protein", "Protéines"],
  ["dairy", "Produits laitiers"],
  ["fat", "Matières grasses"],
  ["allergen", "Allergènes"],
  ["other", "Autres"],
]

const statusOptions: Array<[string, string]> = [
  ["", "—"],
  ["possible", "Possible"],
  ["recommended", "Conseillé"],
]

const allergenOptions: Array<[string, string]> = [
  ["false", "Non"],
  ["true", "Oui"],
]

type EditableRow = { key: string; record: CatalogRecord }

let keyCounter = 0
function nextKey() {
  keyCounter += 1
  return `row-${Date.now().toString(36)}-${keyCounter}`
}

function emptyRecord(): CatalogRecord {
  const record = Object.fromEntries(catalogColumns.map((column) => [column, ""])) as CatalogRecord
  record.category = "other"
  record.sourceCategory = "Autres"
  record.isAllergen = "false"
  record.iconName = "🌿"
  return record
}

function wrap(records: CatalogRecord[]): EditableRow[] {
  return records.map((record) => ({ key: nextKey(), record }))
}

function readDraft(): EditableRow[] | null {
  if (typeof window === "undefined") return null
  try {
    const stored = window.localStorage.getItem(draftKey)
    if (!stored) return null
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return null
    const records = parsed.map((entry) => {
      const source = (entry ?? {}) as Record<string, unknown>
      return Object.fromEntries(
        catalogColumns.map((column) => [column, typeof source[column] === "string" ? (source[column] as string) : ""]),
      ) as CatalogRecord
    })
    return wrap(records)
  } catch {
    return null
  }
}

export function AdminFoodsPage() {
  const access = useAdminAccess()

  if (!access.ready) return <PageLoading label="Admin" />
  if (!access.enabled) return <AdminNotConfigured />
  if (!access.unlocked) return <AdminLoginGate onLogin={access.login} />

  return <AdminCatalogEditor onLogout={access.logout} />
}

function AdminNotConfigured() {
  return (
    <>
      <Header eyebrow="Configuration" title="Admin indisponible" />
      <div className="paper-surface mt-2 grid gap-3 rounded-hero p-5 text-sm leading-6 text-muted-foreground">
        <p>
          Ajoute <span className="font-semibold text-foreground">VITE_ADMIN_USERNAME</span> et{" "}
          <span className="font-semibold text-foreground">VITE_ADMIN_PASSWORD</span> dans l’environnement Docker pour
          activer l’éditeur.
        </p>
        <Button asChild type="button" variant="outline">
          <NavLink to="/">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Retour à l’app
          </NavLink>
        </Button>
      </div>
    </>
  )
}

function AdminLoginGate({ onLogin }: { onLogin: (username: string, password: string) => boolean }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(false)
    const ok = onLogin(username, password)
    if (!ok) {
      setError(true)
      setPassword("")
    }
  }

  return (
    <>
      <Header eyebrow="Espace réservé" title="Mode admin" />
      <form onSubmit={(event) => void submit(event)} className="paper-surface mt-2 grid gap-3 rounded-hero p-5">
        <label htmlFor="admin-username" className="text-sm font-semibold">
          Identifiant
        </label>
        <Input
          id="admin-username"
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(event) => {
            setUsername(event.target.value)
            setError(false)
          }}
          placeholder="admin"
          aria-invalid={error}
        />
        <label htmlFor="admin-password" className="text-sm font-semibold">
          Mot de passe
        </label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError(false)
          }}
          placeholder="••••••••"
          aria-invalid={error}
        />
        {error && <p className="text-sm text-destructive">Identifiant ou mot de passe incorrect.</p>}
        <Button type="submit" disabled={!username.trim() || !password}>
          <Lock data-icon="inline-start" aria-hidden="true" />
          Se connecter
        </Button>
      </form>
    </>
  )
}

function AdminCatalogEditor({ onLogout }: { onLogout: () => void }) {
  const [rows, setRows] = useState<EditableRow[]>(() => readDraft() ?? wrap(rawCatalogRows.map((record) => ({ ...record }))))
  const [query, setQuery] = useState("")
  const [selectedKey, setSelectedKey] = useState<string | null>(() => null)

  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(rows.map((row) => row.record)))
    } catch {
      // Draft persistence is best-effort.
    }
  }, [rows])

  const hasChanges = useMemo(
    () => serializeCatalog(rows.map((row) => row.record)) !== serializeCatalog(rawCatalogRows),
    [rows],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!normalizedQuery) return true
        return (row.record.name ?? "").toLowerCase().includes(normalizedQuery)
      }),
    [rows, normalizedQuery],
  )

  const selectedRow = rows.find((row) => row.key === selectedKey) ?? null

  const updateField = useCallback(
    (key: string, column: string, value: string) => {
      setRows((current) =>
        current.map((row) => (row.key === key ? { ...row, record: { ...row.record, [column]: value } } : row)),
      )
    },
    [],
  )

  function addFood() {
    const created: EditableRow = { key: nextKey(), record: emptyRecord() }
    setRows((current) => [created, ...current])
    setSelectedKey(created.key)
    setQuery("")
  }

  function deleteFood(key: string) {
    const target = rows.find((row) => row.key === key)
    const label = target?.record.name?.trim() || "cet aliment"
    if (!window.confirm(`Supprimer ${label} du catalogue ?`)) return
    setRows((current) => current.filter((row) => row.key !== key))
    if (selectedKey === key) setSelectedKey(null)
  }

  function resetDraft() {
    if (hasChanges && !window.confirm("Annuler toutes les modifications non exportées ?")) return
    setRows(wrap(rawCatalogRows.map((record) => ({ ...record }))))
    setSelectedKey(null)
  }

  async function exportCsv() {
    const exportable = rows.map((row) => row.record).filter((record) => (record.name ?? "").trim().length > 0)
    const skipped = rows.length - exportable.length
    try {
      const didSave = await saveTextFile(serializeCatalog(exportable), "FoodCatalog.csv", "text/csv")
      if (!didSave) return
      toast.success("FoodCatalog.csv exporté", {
        description:
          `Remplace src/data/FoodCatalog.csv et committe.${skipped > 0 ? ` ${skipped} ligne(s) sans nom ignorée(s).` : ""}`,
      })
    } catch {
      toast.error("Export impossible")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Header eyebrow="Édition du catalogue" title="Mode admin" />
        <Button asChild type="button" size="sm" variant="ghost" className="shrink-0">
          <NavLink to="/settings">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Réglages
          </NavLink>
        </Button>
      </div>

      <div className="paper-surface mt-2 flex flex-wrap items-center gap-2 rounded-hero p-3">
        <Button type="button" size="sm" onClick={() => void exportCsv()}>
          <Download data-icon="inline-start" aria-hidden="true" />
          Exporter le CSV
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addFood}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Ajouter
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={resetDraft} disabled={!hasChanges}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Réinitialiser
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {rows.length} aliment{rows.length > 1 ? "s" : ""}
          {hasChanges ? " · modifié" : " · à jour"}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={onLogout}>
          <Lock data-icon="inline-start" aria-hidden="true" />
          Déconnexion
        </Button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un aliment…"
              className="pl-9"
              aria-label="Rechercher un aliment"
            />
          </div>
          <ul className="grid max-h-[60vh] gap-1 overflow-y-auto rounded-xl border bg-card/60 p-1.5">
            {filteredRows.length === 0 && (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">Aucun aliment.</li>
            )}
            {filteredRows.map((row) => {
              const active = row.key === selectedKey
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(row.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/10 text-foreground" : "hover:bg-muted",
                    )}
                  >
                    <span aria-hidden="true">{row.record.iconName || "🌿"}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {row.record.name?.trim() || "Sans nom"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{row.record.category}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {selectedRow ? (
          <FoodEditor
            key={selectedRow.key}
            row={selectedRow}
            onChange={(column, value) => updateField(selectedRow.key, column, value)}
            onDelete={() => deleteFood(selectedRow.key)}
          />
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Sélectionne un aliment à gauche pour éditer sa fiche, ou ajoute-en un nouveau.
          </div>
        )}
      </div>

    </>
  )
}

function FoodEditor({
  row,
  onChange,
  onDelete,
}: {
  row: EditableRow
  onChange: (column: string, value: string) => void
  onDelete: () => void
}) {
  const { record } = row
  const preview = foodFromRecord(record)

  return (
    <div className="paper-surface grid gap-4 rounded-hero p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-[-0.01em]">{record.name?.trim() || "Nouvel aliment"}</p>
          {preview ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {preview.category} · dès {preview.minAgeMonths} mois · {preview.level}
              {preview.isAllergen ? " · allergène" : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-destructive">Renseigne un nom pour publier cette fiche.</p>
          )}
        </div>
        <Button type="button" size="sm" variant="ghost" className="shrink-0 text-destructive" onClick={onDelete}>
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          Supprimer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nom" value={record.name ?? ""} onChange={(value) => onChange("name", value)} />
        <TextField label="Emoji" value={record.iconName ?? ""} onChange={(value) => onChange("iconName", value)} />

        <SelectField
          label="Catégorie"
          value={record.category ?? ""}
          options={categoryOptions}
          onChange={(value) => onChange("category", value)}
        />
        <TextField
          label="Libellé catégorie (source)"
          value={record.sourceCategory ?? ""}
          onChange={(value) => onChange("sourceCategory", value)}
        />

        <SelectField
          label="Statut 4 mois"
          value={record.status4 ?? ""}
          options={statusOptions}
          onChange={(value) => onChange("status4", value)}
        />
        <SelectField
          label="Statut 6 mois"
          value={record.status6 ?? ""}
          options={statusOptions}
          onChange={(value) => onChange("status6", value)}
        />
        <SelectField
          label="Statut 9 mois"
          value={record.status9 ?? ""}
          options={statusOptions}
          onChange={(value) => onChange("status9", value)}
        />
        <SelectField
          label="Statut 12 mois"
          value={record.status12 ?? ""}
          options={statusOptions}
          onChange={(value) => onChange("status12", value)}
        />

        <TextField
          label="Âge conseillé (mois)"
          value={record.recommendedAgeInMonths ?? ""}
          inputMode="numeric"
          onChange={(value) => onChange("recommendedAgeInMonths", value)}
        />
        <SelectField
          label="Allergène"
          value={record.isAllergen ?? "false"}
          options={allergenOptions}
          onChange={(value) => onChange("isAllergen", value)}
        />

        <TextField
          label="Saison (texte)"
          value={record.seasonText ?? ""}
          onChange={(value) => onChange("seasonText", value)}
        />
        <TextField
          label="Mois de saison (ex. 3,4,5)"
          value={record.seasons ?? ""}
          onChange={(value) => onChange("seasons", value)}
        />

        <TextField label="Quantité 4 mois" value={record.quantity4 ?? ""} onChange={(value) => onChange("quantity4", value)} />
        <TextField label="Quantité 6 mois" value={record.quantity6 ?? ""} onChange={(value) => onChange("quantity6", value)} />
        <TextField label="Quantité 9 mois" value={record.quantity9 ?? ""} onChange={(value) => onChange("quantity9", value)} />
        <TextField label="Quantité 12 mois" value={record.quantity12 ?? ""} onChange={(value) => onChange("quantity12", value)} />
      </div>

      <TextAreaField
        label="Restriction / précaution"
        value={record.restriction ?? ""}
        onChange={(value) => onChange("restriction", value)}
      />
      <TextAreaField
        label="Description courte"
        value={record.shortDescription ?? ""}
        onChange={(value) => onChange("shortDescription", value)}
      />
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  inputMode?: "numeric" | "text"
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <Input value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <Textarea value={value} rows={2} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <Select
        value={value === "" ? emptySelectValue : value}
        onValueChange={(next) => onChange(next === emptySelectValue ? "" : next)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue || emptySelectValue} value={optionValue === "" ? emptySelectValue : optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
