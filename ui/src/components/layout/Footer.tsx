import { CONTACT_MAILTO } from '@/content/portfolio'

export default function Footer({ onReset }: { onReset?: () => void }) {
  return (
    <footer className="folio-footer">
      <div className="folio-footer-inner">
        <nav className="ff-links">
          {onReset && (
            <button className="ff-link" onClick={onReset} type="button">
              <span className="ff-link-label">Retour au portail</span>
            </button>
          )}
          <span className="ff-link">
            <span className="ff-link-label">X</span>
          </span>
          <span className="ff-link">
            <span className="ff-link-label">LinkedIn</span>
          </span>
          <a className="ff-link" href={CONTACT_MAILTO}>
            <span className="ff-link-label">Email</span>
          </a>
        </nav>
      </div>
    </footer>
  )
}
