'use client';

import React, { useEffect } from 'react';

const GoogleTranslateManager = () => {
  // --- Cookie Helper ---
  const deleteCookie = (name) => {
    const domain = window.location.hostname;
    const baseDomain = domain.replace(/^www\./, '');
    const expires = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    document.cookie = `${name}=; path=/; domain=${domain}${expires}`;
    document.cookie = `${name}=; path=/; domain=.${baseDomain}${expires}`;
    document.cookie = `${name}=; path=/;${expires}`;
  };

  const changeLanguage = (langCode) => {
    // 1. Delete old cookie
    deleteCookie('googtrans');

    // 2. Set new cookie & Reload
    setTimeout(() => {
      document.cookie = `googtrans=/en/${langCode};path=/;domain=${window.location.hostname};`;
      document.cookie = `googtrans=/en/${langCode};path=/;`;
      window.location.reload();
    }, 100);
  };

  useEffect(() => {
    // Expose function globally
    window.changeGoogleTranslateLanguage = changeLanguage;

    // --- CSS to Hide Banner ---
    const styleId = 'google-translate-banner-fix';
    if (!document.getElementById(styleId)) {
       const css = `
              .goog-te-banner-frame.skiptranslate { display: none !important; }
              body { top: 0 !important; position: static !important; }
              html { top: 0 !important; }
              .goog-te-banner-frame { display: none !important; height: 0 !important; visibility: hidden !important; opacity: 0 !important; z-index: -1 !important; }
              .skiptranslate { z-index: 0 !important; }
              .goog-te-balloon-frame { display: none !important; }
              #goog-gt-tt, .goog-te-balloon-frame { display: none !important; } 
              .goog-text-highlight { background: none !important; box-shadow: none !important; }
              .goog-te-menu-frame.skiptranslate { display: none !important; }
              .goog-tooltip { display: none !important; }
              .goog-tooltip:hover { display: none !important; }
            `;
      const style = document.createElement('style');
      style.id = styleId;
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }

    // --- Initialize Script ---
    const googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
    };

    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const addScript = document.createElement('script');
      addScript.id = scriptId;
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);
      window.googleTranslateElementInit = googleTranslateElementInit;
    }
  }, []);

  return <div id="google_translate_element" style={{ display: 'none' }}></div>;
};

export default GoogleTranslateManager;