/**
 * Script anti-flash: fija `data-theme` en <html> ANTES del primer paint, segun
 * la preferencia guardada. Por defecto DARK. Evita el parpadeo de tema al cargar.
 */
const CODE = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export const ThemeScript = () => <script dangerouslySetInnerHTML={{ __html: CODE }} />;
