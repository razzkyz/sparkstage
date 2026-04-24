declare global {
  interface Window {
    loadJokulCheckout?: (paymentUrl: string) => void;
  }
}

function getDokuCheckoutScriptUrl() {
  const isProduction = import.meta.env.VITE_DOKU_IS_PRODUCTION === 'true';
  return isProduction
    ? 'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
    : 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';
}

export function loadDokuCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadJokulCheckout) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-doku-checkout="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load DOKU Checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = getDokuCheckoutScriptUrl();
    script.async = true;
    script.dataset.dokuCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load DOKU Checkout'));
    document.head.appendChild(script);
  });
}

export function openDokuCheckout(paymentUrl: string) {
  if (!window.loadJokulCheckout) {
    throw new Error('DOKU Checkout is not loaded yet.');
  }

  window.loadJokulCheckout(paymentUrl);
}
