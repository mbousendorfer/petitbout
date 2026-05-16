import { Toaster as Sonner } from "sonner"

const Toaster = () => (
  <Sonner
    position="top-center"
    toastOptions={{
      classNames: {
        toast: "bg-background text-foreground border-border",
        description: "text-muted-foreground",
      },
    }}
  />
)

export { Toaster }
