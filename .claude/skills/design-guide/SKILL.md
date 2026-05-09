---
name: design-guide
description: Ensures every UI component looks modern and professional with clean, minimal design. Use when building ANY user interface element including buttons, forms, cards, layouts, web pages, or React/HTML artifacts. Provides spacing, typography, color, and interaction guidelines.
---

# Design Guide

Apply these principles to every UI component to ensure modern, professional appearance.

## Core Principles

**Clean and Minimal**

- Use abundant white space
- Avoid clutter
- One primary action per section

**Color Palette**

- Base: grays and off-whites (#F9FAFB, #F3F4F6, #E5E7EB, #6B7280, #374151)
- ONE accent color used sparingly (avoid generic purple/blue gradients)
- 60% neutral, 30% secondary neutral, 10% accent

**NO Generic Gradients**

- Never use rainbow or multi-color gradients
- Avoid purple/blue gradient combinations
- Solid colors or subtle single-color gradients only

## Spacing System (8px Grid)

Use only these values: 8, 16, 24, 32, 48, 64px

```css
/* Component internal padding */
padding: 16px; /* Standard */
padding: 24px; /* Comfortable */

/* Between elements */
gap: 16px; /* Related items */
gap: 32px; /* Sections */
gap: 48px; /* Major sections */
```

## Typography

**Hierarchy**

- Heading 1: 32px, bold
- Heading 2: 24px, semibold
- Heading 3: 20px, semibold
- Body: 16px minimum (never smaller)
- Small text: 14px (use sparingly)

**Font Limits**: Maximum 2 font families per design

## Visual Elements

**Shadows** - Subtle only

```css
/* Good */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* Bad - too heavy */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
```

**Rounded Corners** - Use selectively

```css
border-radius: 8px; /* Standard */
border-radius: 12px; /* Larger elements */
/* Not everything needs rounding */
```

**Borders**

```css
border: 1px solid #e5e7eb; /* Subtle gray */
```

## Interactive States

Always define hover, active, and disabled states:

```css
/* Button states */
.button {
  background: #3b82f6;
  transition: all 0.2s;
}
.button:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
.button:active {
  transform: translateY(0);
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Component Patterns

### Buttons

- Padding: 12px 24px (vertical horizontal)
- Subtle shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Clear hover state (darker background or lift)
- NO gradients

### Cards

- Border OR subtle shadow, not both
- Padding: 24px
- Background: white or light gray

```css
/* Option A: Border */
border: 1px solid #e5e7eb;

/* Option B: Shadow */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Forms

- Labels above inputs (16px, #374151)
- Input padding: 12px 16px
- Clear error states (red border + red text below)
- Spacing between fields: 24px

```css
.form-field {
  margin-bottom: 24px;
}
.input {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.input:focus {
  border-color: #3b82f6;
  outline: none;
}
.input.error {
  border-color: #ef4444;
}
```

## Mobile-First

Start with mobile layout, enhance for desktop:

- Stack vertically on mobile
- Side-by-side on desktop (768px+)
- Touch targets minimum 44px
- Readable without zooming

## Anti-Patterns (Never Do)

❌ Rainbow gradients  
❌ Text smaller than 14px  
❌ Inconsistent spacing (mixing random values)  
❌ Every element different color  
❌ Heavy drop shadows  
❌ Too many border radius values  
❌ No hover states  
❌ Cards with both border AND shadow
