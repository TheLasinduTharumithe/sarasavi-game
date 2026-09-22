export function initializeNetworkStatus(): void {
  const indicator = document.createElement('div')
  indicator.className = 'network-status'
  indicator.setAttribute('role', 'status')
  indicator.setAttribute('aria-live', 'polite')
  document.body.append(indicator)

  const orientationHint = document.createElement('p')
  orientationHint.className = 'orientation-hint'
  orientationHint.textContent = 'Rotate to landscape for larger controls.'
  document.body.append(orientationHint)

  const updateIndicator = (): void => {
    const online = navigator.onLine
    indicator.textContent = online ? 'Online' : 'Offline'
    indicator.classList.toggle('network-status--offline', !online)
  }

  window.addEventListener('online', updateIndicator)
  window.addEventListener('offline', updateIndicator)
  updateIndicator()
}
