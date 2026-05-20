declare global {
  interface Window {
    loadJokulCheckout?: (paymentUrl: string) => void;
    JokulCheckout?: {
      closeCheckout?: () => void;
    };
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

/**
 * Reset DOKU SDK state to prevent payment session reuse.
 * Must be called before opening a new checkout to ensure clean payment context.
 * Fixes: "saat user cancel payment: popup berikutnya wajib generate payment baru"
 */
export function resetDokuCheckoutState() {
  // Close any open DOKU checkout popup
  if (window.JokulCheckout?.closeCheckout) {
    try {
      window.JokulCheckout.closeCheckout();
    } catch (err) {
      console.warn('[dokuCheckout] Failed to close DOKU popup:', err);
    }
  }

  // Remove DOKU overlay/modal elements if they exist
  const dokuOverlay = document.querySelector('[data-doku-overlay], .jokul-checkout-overlay, .jokul-overlay');
  if (dokuOverlay) {
    dokuOverlay.remove();
  }

  // Clear global DOKU state to force fresh initialization
  if (window.loadJokulCheckout) {
    delete window.loadJokulCheckout;
  }
  if (window.JokulCheckout) {
    delete window.JokulCheckout;
  }

  console.log('[dokuCheckout] DOKU checkout state reset for clean payment session');
}

export function openDokuCheckout(paymentUrl: string) {
  if (!window.loadJokulCheckout) {
    throw new Error('DOKU Checkout is not loaded yet.');
  }

  window.loadJokulCheckout(paymentUrl);
}
