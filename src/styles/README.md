# Modern UI Design System

This design system provides a comprehensive set of CSS custom properties, utility classes, and component styles for the modern UI redesign.

## Files Structure

- `design-system.css` - Core design tokens and CSS custom properties
- `utilities.css` - Utility classes for common styling patterns
- `components.css` - Pre-built component styles
- `animations.css` - Animation system (existing)
- `mobile.css` - Mobile-specific optimizations (existing)

## Design Tokens

### Colors

```css
/* Primary Colors */
--color-primary-500: #10b981; /* Main green */

/* Category Colors */
--color-food: #f59e0b; /* Amber */
--color-clothing: #ec4899; /* Pink */
--color-travel: #3b82f6; /* Blue */
--color-super: #8b5cf6; /* Purple */

/* Discount Badge Colors */
--color-discount-active: #dc2626; /* Red */
--color-discount-featured: #10b981; /* Green */
--color-discount-upcoming: #3b82f6; /* Blue */
--color-discount-expired: #6b7280; /* Gray */
```

### Typography

```css
/* Font Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing (8px Grid)

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
```

## Utility Classes

### Typography

- `.text-heading-1` - Large heading style
- `.text-heading-2` - Medium heading style
- `.text-body` - Body text style
- `.text-caption` - Small caption text

### Buttons

- `.btn-base` - Base button styles
- `.btn-primary` - Primary button with gradient
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Ghost button

### Cards

- `.card-modern` - Modern card with shadow
- `.card-featured` - Featured card with gradient
- `.card-business` - Business card styling

### Badges

- `.badge-discount-active` - Red discount badge
- `.badge-discount-featured` - Green featured badge
- `.badge-category-food` - Food category badge

### Layout

- `.container-modern` - Responsive container
- `.grid-categories` - 4-column category grid
- `.flex-between` - Flex with space-between
- `.section-spacing` - Standard section spacing

## Component Classes

### Header

```css
.header-modern {
  /* Sticky header with backdrop blur */
}
```

### Search Bar

```css
.search-bar-modern {
  /* Modern search input with icons */
}
```

### Category Grid

```css
.category-grid {
  /* 4-column responsive grid */
}

.category-item {
  /* Individual category card */
}
```

### Business Cards

```css
.business-card-modern {
  /* Modern business card with hover effects */
}
```

## Usage Examples

### Basic Button

```html
<button class="btn-base btn-primary">Primary Action</button>
```

### Category Item

```html
<div class="category-item">
  <div class="category-icon food">🍕</div>
  <span class="category-label">Comida</span>
</div>
```

### Business Card

```html
<div class="business-card-modern">
  <img class="business-card-image" src="..." alt="Business" />
  <div class="business-card-content">
    <h3 class="business-name">Business Name</h3>
    <p class="business-category">Category</p>
  </div>
</div>
```

## Responsive Design

The design system is mobile-first and includes responsive breakpoints:

- Mobile: 320px - 640px
- Tablet: 640px - 1024px
- Desktop: 1024px+

## Accessibility

All components include:

- Proper color contrast ratios
- Minimum 44px touch targets
- Focus indicators
- Screen reader support

## Dark Mode

The design system includes automatic dark mode support based on user preferences.
