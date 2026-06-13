import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SettingsSection } from "@/pages/SettingsPage"
import { cn } from "@/lib/utils"

const runtimeConfig = typeof window !== "undefined" ? window.__PETITBOUT_CONFIG__ : undefined
const feedbackEmail =
  runtimeConfig?.VITE_FEEDBACK_EMAIL || (import.meta.env.VITE_FEEDBACK_EMAIL as string | undefined) || ""

const feedbackTypes = ["Idée", "Problème", "J’aime bien", "Je suis perdu", "Autre"] as const

export function FeedbackPage() {
  const navigate = useNavigate()
  const [feedbackType, setFeedbackType] = useState<string>("")
  const [context, setContext] = useState("")
  const [message, setMessage] = useState("")
  const [contactEmail, setContactEmail] = useState("")

  const isFeedbackConfigured = feedbackEmail.trim().length > 0

  function prepareEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const contact = contactEmail.trim()
    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      toast.error("L’adresse email de contact semble incomplète")
      return
    }

    if (!isFeedbackConfigured) return

    const body = [
      "Type de retour :",
      feedbackType || "Non renseigné",
      "",
      "Page ou moment concerné :",
      context.trim() || "Non renseigné",
      "",
      "Message :",
      message.trim() || "Non renseigné",
      "",
      "Contact éventuel :",
      contact || "Non renseigné",
      "",
      "Contexte technique :",
      `Date : ${new Date().toLocaleString("fr-FR")}`,
      `URL : ${window.location.href}`,
      `Navigateur : ${navigator.userAgent}`,
    ].join("\n")

    const mailtoUrl = `mailto:${feedbackEmail.trim()}?subject=${encodeURIComponent(
      "Feedback Petitbout",
    )}&body=${encodeURIComponent(body)}`

    window.location.href = mailtoUrl
    toast.success("Brouillon d’email préparé")
  }

  return (
    <>
      <header className="flex items-center gap-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground"
          onClick={() => navigate("/settings")}
          aria-label="Retour aux réglages"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="eyebrow">Réglages</p>
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">
            Ton avis sur Petitbout
          </h1>
        </div>
      </header>

      <div className="grid gap-1">
        <SettingsSection
          description="Rien n’est obligatoire. Même quelques mots peuvent aider à améliorer l’app."
          title="Feedback"
        >
          <form className="grid gap-4" noValidate onSubmit={prepareEmail}>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-semibold">Type de retour</legend>
              <div className="flex flex-wrap gap-2">
                {feedbackTypes.map((type) => {
                  const selected = feedbackType === type

                  return (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      aria-pressed={selected}
                      className={cn(
                        "h-11 rounded-full px-3 text-sm shadow-none",
                        selected && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                      )}
                      onClick={() => setFeedbackType(selected ? "" : type)}
                    >
                      {type}
                    </Button>
                  )
                })}
              </div>
            </fieldset>

            <label className="grid gap-1.5 text-sm font-medium">
              <span>Page ou moment concerné</span>
              <Input
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="Aliments, journal, réglages…"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              <span>Ton retour</span>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-40 resize-y"
                placeholder="Dis-le comme ça vient, même en quelques mots."
              />
              <span className="text-xs leading-5 text-muted-foreground">
                Une idée, une frustration, un doute ou un détail qui t’a plu : tout est bienvenu.
              </span>
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              <span>Peut-on te recontacter ?</span>
              <Input
                type="email"
                inputMode="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="ton@email.fr"
              />
              <span className="text-xs leading-5 text-muted-foreground">
                Optionnel. Utile seulement si tu veux une réponse.
              </span>
            </label>

            {!isFeedbackConfigured && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Adresse de feedback non configurée.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={!isFeedbackConfigured}>
                <Send data-icon="inline-start" aria-hidden="true" />
                Préparer l’email
              </Button>
            </div>
          </form>
        </SettingsSection>
      </div>
    </>
  )
}
