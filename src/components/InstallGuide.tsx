import { useState } from 'react'
import { MoreVertical, Share, SquarePlus, Smartphone, X } from 'lucide-react'

const isStandalone = () =>
  (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
  (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches)
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1))

/** Na tela inicial, aberto pelo navegador: botão "Instalar no celular" com o passo a passo (iPhone ou Android). */
export function InstallGuide() {
  const [open, setOpen] = useState(false)
  if (isStandalone()) return null
  const ios = isIOS()
  return (
    <>
      <button className="btn install-btn" onClick={() => setOpen(true)}>
        <Smartphone size={16} aria-hidden="true" /> Instalar no celular
      </button>
      {open && (
        <div className="sheet-backdrop import-backdrop" onClick={() => setOpen(false)}>
          <div
            className="import-card install-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="install-title" className="pg-title">
              {ios ? 'Instalar no iPhone' : 'Instalar no Android'}
            </h2>
            <ol className="install-steps">
              {ios ? (
                <>
                  <li>
                    Abra este site no <b>Safari</b> (no Chrome do iPhone também funciona, pelo mesmo botão).
                  </li>
                  <li>
                    Toque em <b>Compartilhar</b> <Share size={16} aria-label="ícone Compartilhar" /> na barra de baixo
                    (ou de cima, no iPad).
                  </li>
                  <li>
                    Role a lista e toque em <b>Adicionar à Tela de Início</b>{' '}
                    <SquarePlus size={16} aria-label="ícone Adicionar" />.
                  </li>
                  <li>
                    Deixe o nome <b>Camo Tracker</b> e toque em <b>Adicionar</b>.
                  </li>
                  <li>Abra pelo ícone novo na tela de início e entre com seu usuário e senha.</li>
                </>
              ) : (
                <>
                  <li>
                    Abra este site no <b>Chrome</b>.
                  </li>
                  <li>
                    Toque no menu <MoreVertical size={16} aria-label="ícone de menu" /> no canto de cima.
                  </li>
                  <li>
                    Toque em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>) e confirme.
                  </li>
                  <li>Abra pelo ícone novo e entre com seu usuário e senha.</li>
                </>
              )}
            </ol>
            <p>
              Instalado, o app abre em tela cheia, como um app de verdade, e funciona mesmo sem internet. No iPhone ele
              guarda o login separado do navegador, por isso pede para entrar de novo na primeira vez.
            </p>
            <button className="btn" onClick={() => setOpen(false)}>
              <X size={16} aria-hidden="true" /> Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
