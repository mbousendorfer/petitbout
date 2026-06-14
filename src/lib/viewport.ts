const defaultViewport = "width=device-width, initial-scale=1, viewport-fit=cover"
const standaloneViewport = `${defaultViewport}, maximum-scale=1, user-scalable=no`
const fixedBottomOffsetProperty = "--fixed-bottom-offset"

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

function updateFixedBottomOffset() {
  const viewport = window.visualViewport
  const layoutHeight = document.documentElement.clientHeight || window.innerHeight
  const visualBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
  const offset = Math.max(0, Math.round(visualBottom - layoutHeight))

  document.documentElement.style.setProperty(fixedBottomOffsetProperty, `${offset}px`)
}

applyPwaViewport()
updateFixedBottomOffset()

window.matchMedia("(display-mode: standalone)").addEventListener("change", applyPwaViewport)
window.addEventListener("appinstalled", applyPwaViewport)
window.addEventListener("orientationchange", updateFixedBottomOffset)
window.visualViewport?.addEventListener("resize", updateFixedBottomOffset)
window.visualViewport?.addEventListener("scroll", updateFixedBottomOffset)
