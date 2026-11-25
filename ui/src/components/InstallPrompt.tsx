import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * The "add to home screen" offer.
 *
 * Reuses the site's own recipe — card surface, rule line, 16px radius and the
 * accent/background pairing already used by `::selection` — so it reads as part
 * of the page. It renders nothing unless a real install path exists, and stays
 * out of the way at the bottom of the viewport.
 */
export default function InstallPrompt() {
  const { visible, mode, install, dismiss } = useInstallPrompt()
  if (!visible) return null

  const isIos = mode === 'ios'

  return (
    <div className="install-prompt" role="dialog" aria-labelledby="install-prompt-title">
      <img
        className="install-prompt-logo"
        src={`${import.meta.env.BASE_URL}icon-192.png`}
        alt=""
        width={40}
        height={40}
      />
      <div className="install-prompt-body">
        <p className="install-prompt-title" id="install-prompt-title">
          Installer Oxira
        </p>
        <p className="install-prompt-message">
          {isIos
            ? 'Appuyez sur Partager, puis « Sur l’écran d’accueil ».'
            : 'Le portfolio en plein écran — même hors\u00a0ligne.'}
        </p>
      </div>
      {isIos ? null : (
        <button type="button" className="install-prompt-action" onClick={() => void install()}>
          Installer
        </button>
      )}
      <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="Fermer">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
