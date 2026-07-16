import { registerRootComponent } from 'expo'
import App from './App'
import { initTheme } from './src/lib/theme'

// Fix web viewport height + inject CSS variable defaults (Indigo theme)
// initTheme() overrides these with the user's stored preference before first paint
if (typeof document !== 'undefined') {
  const s = document.createElement('style')
  s.textContent = [
    'html,body,#root{height:100%;overflow:hidden;margin:0;padding:0;}',
    ':root{',
    '--fo-bg:#F7F8FC;--fo-surface:#FFFFFF;--fo-surface-el:#F0F2F8;',
    '--fo-text:#0F1523;--fo-text-sec:#5A6580;',
    '--fo-accent:#3D52A0;--fo-accent-soft:#7091D4;--fo-accent-bg:#EBF0FB;',
    '--fo-border:#DDE2EF;--fo-border-soft:#EEF1F9;',
    '--fo-in-memoriam:#8A93A8;--fo-danger:#C0392B;',
    '--fo-success:#27AE60;--fo-info:#2980B9;',
    '}',
  ].join('')
  document.head.appendChild(s)
  initTheme()
}

registerRootComponent(App)
