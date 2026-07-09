---
name: Şehir Paneli
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#3e2400'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c3800'
  on-tertiary-container: '#ef9900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is rooted in the "Corporate / Modern" aesthetic, tailored for a high-end city guide and local business ecosystem. It balances the authority of a municipal platform with the polished usability of a premium SaaS product. 

The brand personality is **authoritative yet accessible**. It aims to evoke a sense of security and local pride through precise alignment, generous whitespace, and a sophisticated color logic. The visual language moves away from cluttered directory styles toward a curated, editorial experience that prioritizes clarity and high-quality merchant representation.

## Colors
This design system utilizes a palette designed for institutional trust and commercial vibrancy.

- **Primary (#1E3A8A):** A deep Navy used for navigation, primary buttons, and headings to establish stability.
- **Secondary (#10B981):** A "Trust Green" reserved for 'Verified' badges, 'Open Now' indicators, and success states.
- **Tertiary (#F59E0B):** A "Warm Gold" used sparingly for high-value CTAs, 'Sponsored' tags, and rating stars to catch the eye without breaking the professional tone.
- **Neutral:** A range of Slate grays (from #0F172A for text to #F8FAFC for background surfaces) ensures a clean, airy feel that lets business photography stand out.

## Typography
The typography strategy employs a dual-font approach to differentiate between brand-led headings and utility-led data.

- **Headlines:** Uses **Hanken Grotesk**. Its sharp, contemporary geometry provides a high-end SaaS feel, especially in larger sizes where the letter spacing is tightened for impact.
- **Body & Labels:** Uses **Inter**. Chosen for its exceptional legibility in dense lists and business descriptions. 
- **Hierarchy:** Use `label-md` for small metadata like business categories and `label-sm` for status badges. Headlines should always use the Primary Navy color to maintain structural authority.

## Layout & Spacing
The layout follows a **fixed grid** philosophy for desktop to maintain a premium, centered feel, transitioning to a fluid model for mobile devices.

- **Grid:** A 12-column grid is used for desktop (1280px max-width). Cards usually span 3 or 4 columns depending on the information density required.
- **Rhythm:** An 8px base unit governs all dimensions. Use `stack-md` (24px) for vertical spacing between related elements and `stack-lg` (48px) to separate distinct sections of the city guide.
- **Responsive Behavior:** On mobile, side margins shrink to 16px, and multi-column card grids collapse into a single-column vertical stack or a horizontally scrollable carousel for discovery sections.

## Elevation & Depth
Depth is handled through **Tonal Layering** and **Ambient Shadows**. 

The background is kept at a light gray (#F8FAFC), while interactive elements like cards and search inputs sit on pure white (#FFFFFF) surfaces. Shadows are highly diffused and low-opacity (e.g., `box-shadow: 0 4px 20px rgba(30, 58, 138, 0.05)`), using a tiny hint of the primary Navy color in the shadow tint to maintain color harmony. Hover states should slightly increase the shadow spread and lift the element by 2-4px to provide tactile feedback.

## Shapes
The shape language is consistently **Rounded**, using a 12px (0.75rem) to 16px (1rem) radius for most containers. This softens the professional tone, making the platform feel welcoming and modern.

- **Standard Elements:** 8px radius (Buttons, Input fields).
- **Cards & Modals:** 16px radius (Business cards, Event listings).
- **Badges:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use the Navy background with white text. CTAs for 'Book' or 'Contact' use the Warm Gold to drive conversion. Use a subtle 1px inset border on hover for added depth.
- **Status Badges:** Use 'Secondary Green' with 10% opacity background and 100% opacity text for 'Verified' or 'Open'. Use 'Tertiary Gold' for 'Sponsored'.
- **Cards:** The most critical component. They must feature a high-aspect-ratio image (16:9), followed by a 16px padding area for the title, rating, and category. The card should have a 1px border (#E2E8F0) and a soft ambient shadow.
- **Input Fields:** Search bars should be prominent, with a 16px corner radius and a leading magnifying glass icon in the Neutral color. Use a 2px Primary Navy border for the focus state.
- **Lists:** Use horizontal dividers (1px, #F1F5F9) for mobile list views, ensuring each item has a minimum touch target height of 56px.