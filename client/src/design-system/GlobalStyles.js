// src/design-system/GlobalStyles.jsx
//
// A CSS reset does one job:
// It removes all the default styles browsers apply automatically
// so we start from a predictable blank canvas.
//
// WHY do we need this?
// Every browser (Chrome, Firefox, Safari) has its own default styles.
// h1 might be 2em in Chrome and slightly different in Firefox.
// Buttons have different default padding in each browser.
// Without a reset, your app looks different across browsers.
//
// We inject these styles using a <style> tag in the document head.
// This is a common pattern when not using a CSS framework.

import { useEffect } from 'react';
import { colors, typography, layout } from './tokens';

const GlobalStyles = () => {
  useEffect(() => {

    // Create a <style> element and inject it into <head>
    const style = document.createElement('style');
    style.id    = 'mernshop-global-styles';

    style.innerHTML = `
      /* ── Import Inter font ───────────────────────────────────── */
      /* Already imported in index.html via Google Fonts link tag  */

      /* ── Box sizing reset ────────────────────────────────────── */
      /* By default, width: 200px + padding: 20px = 240px total    */
      /* With border-box: width: 200px includes padding            */
      /* border-box is almost always what you want                 */
      *, *::before, *::after {
        box-sizing: border-box;
        margin:     0;
        padding:    0;
      }

      /* ── Root / HTML ─────────────────────────────────────────── */
      html {
        font-size:               16px;
        -webkit-text-size-adjust: 100%;
        scroll-behavior:          smooth;
      }

      /* ── Body defaults ───────────────────────────────────────── */
      body {
        font-family:        ${typography.fonts.sans};
        font-size:          ${typography.sizes.base};
        font-weight:        ${typography.weights.normal};
        line-height:        ${typography.leading.normal};
        color:              ${colors.neutral[800]};
        background-color:   ${colors.surface.page};

        /* Improves font rendering on Mac */
        -webkit-font-smoothing:  antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* ── Typography reset ────────────────────────────────────── */
      /* Browsers apply sizes/weights to h1-h6 by default          */
      /* We reset them and control everything ourselves             */
      h1, h2, h3, h4, h5, h6 {
        font-weight: ${typography.weights.bold};
        line-height: ${typography.leading.tight};
        color:       ${colors.neutral[900]};
      }

      /* ── Links ───────────────────────────────────────────────── */
      a {
        color:           inherit;
        text-decoration: none;
      }

      /* ── Images ──────────────────────────────────────────────── */
      /* Prevents images from overflowing their containers         */
      img, video {
        max-width: 100%;
        display:   block;
      }

      /* ── Form elements ───────────────────────────────────────── */
      /* Browsers don't inherit font on inputs/buttons by default  */
      input, button, textarea, select {
        font-family: inherit;
        font-size:   inherit;
      }

      /* ── Button reset ────────────────────────────────────────── */
      button {
        cursor:     pointer;
        border:     none;
        background: none;
      }

      /* ── List reset ──────────────────────────────────────────── */
      ul, ol {
        list-style: none;
      }

      /* ── Scrollbar styling (webkit browsers) ─────────────────── */
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: ${colors.neutral[100]};
      }
      ::-webkit-scrollbar-thumb {
        background:    ${colors.neutral[300]};
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${colors.neutral[400]};
      }

      /* ── Focus styles ────────────────────────────────────────── */
      /* Visible focus rings are REQUIRED for keyboard navigation  */
      /* Never do outline: none without providing an alternative   */
      :focus-visible {
        outline:        2px solid ${colors.primary[500]};
        outline-offset: 2px;
      }

      /* ── Selection color ─────────────────────────────────────── */
      ::selection {
        background-color: ${colors.primary[100]};
        color:            ${colors.primary[900]};
      }

      /* ── Utility classes ─────────────────────────────────────── */
      /* These are the ONLY global utility classes we allow        */
      /* Everything else is component-scoped                       */
      .container {
        max-width:    ${layout.maxWidth};
        margin-left:  auto;
        margin-right: auto;
        padding-left:  ${layout.containerPadding};
        padding-right: ${layout.containerPadding};
      }

      .sr-only {
        position: absolute;
        width:    1px;
        height:   1px;
        padding:  0;
        margin:   -1px;
        overflow: hidden;
        clip:     rect(0, 0, 0, 0);
        border:   0;
      }
    `;

    // Only inject if not already present
    // The check prevents duplicate styles on hot reload
    if (!document.getElementById('mernshop-global-styles')) {
      document.head.appendChild(style);
    }

    // Cleanup when component unmounts
    return () => {
      const existing = document.getElementById('mernshop-global-styles');
      if (existing) existing.remove();
    };

  }, []); // empty array = run once on mount

  // This component renders nothing visible
  // It only has a side effect (injecting styles)
  return null;
};

export default GlobalStyles;