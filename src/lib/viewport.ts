const defaultViewport = "width=device-width, initial-scale=1, viewport-fit=cover"
const standaloneViewport = `${defaultViewport}, maximum-scale=1, user-scalable=no`

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  )
}

function setViewport(content: string) {
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (viewport) viewport.content = content
}

function applyPwaViewport() {
  setViewport(isStandaloneDisplay() ? standaloneViewport : defaultViewport)
}

applyPwaViewport()

window.matchMedia("(display-mode: standalone)").addEventListener("change", applyPwaViewport)
window.addEventListener("appinstalled", applyPwaViewport)
