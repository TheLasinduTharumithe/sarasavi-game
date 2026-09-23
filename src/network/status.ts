export function initializeNetworkStatus(): void {
  const indicator = document.createElement('div')
  indicator.className = 'network-status'
  indicator.setAttribute('role', 'status')
  indicator.setAttribute('aria-live', 'polite')
  document.body.append(indicator)

  const updateIndicator = (): void => {
    const online = navigator.onLine
    indicator.textContent = online ? 'Online' : 'Offline'
    indicator.classList.toggle('network-status--offline', !online)
  }

  window.addEventListener('online', updateIndicator)
  window.addEventListener('offline', updateIndicator)
  updateIndicator()
}
