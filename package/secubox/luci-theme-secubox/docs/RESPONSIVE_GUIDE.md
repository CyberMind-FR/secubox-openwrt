# SecuBox Responsive Design Guide

Complete guide to building responsive interfaces with SecuBox utility classes.

## Table of Contents
1. [Breakpoints](#breakpoints)
2. [Utility Classes](#utility-classes)
3. [Responsive Patterns](#responsive-patterns)
4. [Component Examples](#component-examples)
5. [Best Practices](#best-practices)

---

## Breakpoints

SecuBox uses a **mobile-first** approach with 4 breakpoints:

| Breakpoint | Min Width | Target Devices | Prefix |
|------------|-----------|----------------|--------|
| **Mobile** | 0px | Phones | *(none)* |
| **Small** | 480px | Large phones | `cyber-sm:` |
| **Medium** | 768px | Tablets | `cyber-md:` |
| **Large** | 1024px | Small desktops | `cyber-lg:` |
| **Extra Large** | 1200px | Large desktops | `cyber-xl:` |

### Breakpoint Media Queries

```css
/* Mobile-first (no prefix needed) */
.cyber-hidden { display: none; }

/* Small devices and up (≥480px) */
@media (min-width: 480px) {
	.cyber-sm\:block { display: block; }
}

/* Medium devices and up (≥768px) */
@media (min-width: 768px) {
	.cyber-md\:flex { display: flex; }
}

/* Large devices and up (≥1024px) */
@media (min-width: 1024px) {
	.cyber-lg\:grid { display: grid; }
}

/* Extra large devices and up (≥1200px) */
@media (min-width: 1200px) {
	.cyber-xl\:inline { display: inline; }
}
```

---

## Utility Classes

### Spacing

#### Margin

```css
/* All sides */
.cyber-m-0, .cyber-m-xs, .cyber-m-sm, .cyber-m-md, .cyber-m-lg, .cyber-m-xl, .cyber-m-2xl

/* Individual sides */
.cyber-mt-*    /* margin-top */
.cyber-mb-*    /* margin-bottom */
.cyber-ml-*    /* margin-left */
.cyber-mr-*    /* margin-right */

/* Axis */
.cyber-mx-*    /* margin-left + margin-right */
.cyber-my-*    /* margin-top + margin-bottom */
```

#### Padding

```css
/* All sides */
.cyber-p-0, .cyber-p-xs, .cyber-p-sm, .cyber-p-md, .cyber-p-lg, .cyber-p-xl, .cyber-p-2xl

/* Individual sides */
.cyber-pt-*, .cyber-pb-*, .cyber-pl-*, .cyber-pr-*

/* Axis */
.cyber-px-*, .cyber-py-*
```

#### Spacing Scale

| Class Suffix | Value | Pixels |
|--------------|-------|--------|
| `0` | 0 | 0px |
| `xs` | 0.25rem | 4px |
| `sm` | 0.5rem | 8px |
| `md` | 1rem | 16px |
| `lg` | 1.5rem | 24px |
| `xl` | 2rem | 32px |
| `2xl` | 3rem | 48px |

### Display

```css
.cyber-hidden          /* display: none */
.cyber-block           /* display: block */
.cyber-inline-block    /* display: inline-block */
.cyber-flex            /* display: flex */
.cyber-inline-flex     /* display: inline-flex */
.cyber-grid            /* display: grid */
```

### Flexbox

#### Direction

```css
.cyber-flex-row        /* flex-direction: row */
.cyber-flex-col        /* flex-direction: column */
```

#### Wrap

```css
.cyber-flex-wrap       /* flex-wrap: wrap */
.cyber-flex-nowrap     /* flex-wrap: nowrap */
```

#### Justify Content

```css
.cyber-justify-start     /* justify-content: flex-start */
.cyber-justify-center    /* justify-content: center */
.cyber-justify-end       /* justify-content: flex-end */
.cyber-justify-between   /* justify-content: space-between */
.cyber-justify-around    /* justify-content: space-around */
.cyber-justify-evenly    /* justify-content: space-evenly */
```

#### Align Items

```css
.cyber-items-start      /* align-items: flex-start */
.cyber-items-center     /* align-items: center */
.cyber-items-end        /* align-items: flex-end */
.cyber-items-stretch    /* align-items: stretch */
.cyber-items-baseline   /* align-items: baseline */
```

#### Gap

```css
.cyber-gap-0, .cyber-gap-xs, .cyber-gap-sm, .cyber-gap-md, .cyber-gap-lg, .cyber-gap-xl
```

### Grid

#### Grid Columns

```css
.cyber-grid-cols-1      /* grid-template-columns: repeat(1, 1fr) */
.cyber-grid-cols-2      /* grid-template-columns: repeat(2, 1fr) */
.cyber-grid-cols-3      /* ... through 12 */
```

#### Column Span

```css
.cyber-col-span-1       /* grid-column: span 1 */
.cyber-col-span-2       /* grid-column: span 2 */
.cyber-col-span-3       /* ... through 12 */
```

#### Grid Rows

```css
.cyber-grid-rows-1      /* grid-template-rows: repeat(1, 1fr) */
.cyber-grid-rows-2      /* ... through 6 */
```

### Typography

#### Font Size

```css
.cyber-text-xs          /* font-size: 0.75rem (12px) */
.cyber-text-sm          /* font-size: 0.875rem (14px) */
.cyber-text-base        /* font-size: 1rem (16px) */
.cyber-text-lg          /* font-size: 1.125rem (18px) */
.cyber-text-xl          /* font-size: 1.25rem (20px) */
.cyber-text-2xl         /* font-size: 1.5rem (24px) */
.cyber-text-3xl         /* font-size: 1.875rem (30px) */
.cyber-text-4xl         /* font-size: 2.25rem (36px) */
```

#### Text Alignment

```css
.cyber-text-left        /* text-align: left */
.cyber-text-center      /* text-align: center */
.cyber-text-right       /* text-align: right */
```

#### Font Weight

```css
.cyber-font-normal      /* font-weight: 400 */
.cyber-font-medium      /* font-weight: 500 */
.cyber-font-semibold    /* font-weight: 600 */
.cyber-font-bold        /* font-weight: 700 */
```

#### Text Transform

```css
.cyber-uppercase        /* text-transform: uppercase */
.cyber-lowercase        /* text-transform: lowercase */
.cyber-capitalize       /* text-transform: capitalize */
```

---

## Responsive Patterns

### Pattern 1: Mobile-First Layout

```html
<!-- Mobile: Stack vertically, Desktop: 3 columns -->
<div class="cyber-grid cyber-grid-cols-1 cyber-md:grid-cols-3 cyber-gap-md">
	<div>Column 1</div>
	<div>Column 2</div>
	<div>Column 3</div>
</div>
```

### Pattern 2: Conditional Display

```html
<!-- Hide on mobile, show on tablet+ -->
<div class="cyber-hidden cyber-md:block">
	Desktop-only content
</div>

<!-- Show on mobile, hide on desktop -->
<div class="cyber-block cyber-md:hidden">
	Mobile-only content
</div>
```

### Pattern 3: Responsive Spacing

```html
<!-- Small padding on mobile, larger on desktop -->
<div class="cyber-p-sm cyber-md:p-md cyber-lg:p-lg">
	Content with responsive padding
</div>
```

### Pattern 4: Flexible Text Size

```html
<!-- Smaller text on mobile, larger on desktop -->
<h1 class="cyber-text-2xl cyber-md:text-3xl cyber-lg:text-4xl">
	Responsive Heading
</h1>
```

### Pattern 5: Responsive Flexbox

```html
<!-- Column on mobile, row on desktop -->
<div class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-gap-md">
	<div>Item 1</div>
	<div>Item 2</div>
</div>
```

---

## Component Examples

### Example 1: Responsive Card Grid

```html
<div class="cyber-grid cyber-grid-cols-1 cyber-sm:grid-cols-2 cyber-lg:grid-cols-3 cyber-xl:grid-cols-4 cyber-gap-md">
	<!-- Mobile: 1 column -->
	<!-- Small: 2 columns -->
	<!-- Large: 3 columns -->
	<!-- XL: 4 columns -->
	<div class="cyber-card">Card 1</div>
	<div class="cyber-card">Card 2</div>
	<div class="cyber-card">Card 3</div>
	<div class="cyber-card">Card 4</div>
</div>
```

### Example 2: Responsive Navigation

```html
<nav class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-items-center cyber-justify-between cyber-p-md">
	<!-- Logo -->
	<div class="cyber-text-xl cyber-font-bold cyber-mb-md cyber-md:mb-0">
		SecuBox
	</div>

	<!-- Links: Stack on mobile, row on desktop -->
	<div class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-gap-sm cyber-md:gap-md">
		<a href="#">Dashboard</a>
		<a href="#">Apps</a>
		<a href="#">Settings</a>
	</div>
</nav>
```

### Example 3: Responsive Dashboard

```html
<div class="cyber-container cyber-p-sm cyber-md:p-md cyber-lg:p-lg">
	<!-- Page Header -->
	<div class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-justify-between cyber-items-start cyber-md:items-center cyber-mb-lg">
		<h1 class="cyber-text-2xl cyber-md:text-3xl cyber-mb-sm cyber-md:mb-0">
			Dashboard
		</h1>
		<button class="cyber-btn cyber-w-full cyber-md:w-auto">
			Add Widget
		</button>
	</div>

	<!-- Stats Grid -->
	<div class="cyber-grid cyber-grid-cols-1 cyber-sm:grid-cols-2 cyber-lg:grid-cols-4 cyber-gap-md cyber-mb-lg">
		<div class="cyber-card">Stat 1</div>
		<div class="cyber-card">Stat 2</div>
		<div class="cyber-card">Stat 3</div>
		<div class="cyber-card">Stat 4</div>
	</div>

	<!-- Main Content -->
	<div class="cyber-grid cyber-grid-cols-1 cyber-lg:grid-cols-3 cyber-gap-md">
		<!-- Main Area: 2 columns on desktop -->
		<div class="cyber-lg:col-span-2">
			<div class="cyber-card">Main Content</div>
		</div>

		<!-- Sidebar: 1 column on desktop -->
		<div>
			<div class="cyber-card">Sidebar</div>
		</div>
	</div>
</div>
```

### Example 4: Responsive Form

```html
<form class="cyber-card cyber-p-md cyber-md:p-lg">
	<!-- Form Grid -->
	<div class="cyber-grid cyber-grid-cols-1 cyber-md:grid-cols-2 cyber-gap-md">
		<!-- Full width on mobile, half on desktop -->
		<div>
			<label>First Name</label>
			<input type="text" class="cyber-input">
		</div>

		<div>
			<label>Last Name</label>
			<input type="text" class="cyber-input">
		</div>

		<!-- Full width on all sizes -->
		<div class="cyber-md:col-span-2">
			<label>Email</label>
			<input type="email" class="cyber-input">
		</div>

		<div class="cyber-md:col-span-2">
			<label>Message</label>
			<textarea class="cyber-textarea"></textarea>
		</div>
	</div>

	<!-- Buttons: Stack on mobile, inline on desktop -->
	<div class="cyber-flex cyber-flex-col cyber-md:flex-row cyber-gap-sm cyber-mt-md cyber-justify-end">
		<button type="button" class="cyber-btn cyber-btn--ghost">
			Cancel
		</button>
		<button type="submit" class="cyber-btn">
			Submit
		</button>
	</div>
</form>
```

### Example 5: Responsive Table

```html
<!-- Auto-responsive table (uses component CSS) -->
<table class="cyber-table cyber-table-responsive">
	<thead>
		<tr>
			<th>Name</th>
			<th>Status</th>
			<th>Version</th>
			<th>Actions</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td data-label="Name">App Name</td>
			<td data-label="Status">Running</td>
			<td data-label="Version">1.2.3</td>
			<td data-label="Actions">
				<button class="cyber-btn cyber-btn--sm">Edit</button>
			</td>
		</tr>
	</tbody>
</table>
```

---

## Best Practices

### 1. Mobile-First Approach

Always start with mobile styles, then add desktop enhancements:

```html
<!-- ✅ Good: Mobile-first -->
<div class="cyber-text-sm cyber-md:text-base cyber-lg:text-lg">
	Text grows on larger screens
</div>

<!-- ❌ Bad: Desktop-first (requires more classes) -->
<div class="cyber-text-lg cyber-md:text-base cyber-sm:text-sm">
	More complex
</div>
```

### 2. Use Semantic Breakpoints

Choose breakpoints based on content, not devices:

```html
<!-- ✅ Good: Breakpoint when layout needs to change -->
<div class="cyber-flex-col cyber-md:flex-row">

<!-- ❌ Bad: Arbitrary breakpoint -->
<div class="cyber-flex-col cyber-sm:flex-row">
```

### 3. Consistent Spacing

Use spacing scale consistently:

```html
<!-- ✅ Good: Consistent scale -->
<div class="cyber-p-sm cyber-md:p-md cyber-lg:p-lg">

<!-- ❌ Bad: Inconsistent -->
<div class="cyber-p-xs cyber-md:p-xl cyber-lg:p-sm">
```

### 4. Touch-Friendly Targets

Ensure buttons/links are 44px minimum on mobile:

```css
/* Mobile touch target */
.cyber-btn {
	min-height: 44px;
	padding: 0.65rem 1rem;
}
```

### 5. Test on Real Devices

Test your responsive design on:
- Mobile (375px, 414px)
- Tablet (768px, 1024px)
- Desktop (1280px, 1920px)

---

## Common Patterns Reference

### Centered Container

```html
<div class="cyber-container cyber-mx-auto cyber-px-sm cyber-md:px-md">
	<!-- Content automatically centered with responsive padding -->
</div>
```

### Sidebar Layout

```html
<div class="cyber-grid cyber-grid-cols-1 cyber-lg:grid-cols-4 cyber-gap-md">
	<!-- Sidebar: Full width on mobile, 1 column on desktop -->
	<aside class="cyber-lg:col-span-1">Sidebar</aside>

	<!-- Main: Full width on mobile, 3 columns on desktop -->
	<main class="cyber-lg:col-span-3">Main Content</main>
</div>
```

### Hero Section

```html
<section class="cyber-py-lg cyber-md:py-xl cyber-text-center">
	<h1 class="cyber-text-3xl cyber-md:text-4xl cyber-lg:text-5xl cyber-mb-md">
		Hero Title
	</h1>
	<p class="cyber-text-base cyber-md:text-lg cyber-text-muted cyber-mb-lg">
		Subtitle
	</p>
	<button class="cyber-btn cyber-w-full cyber-md:w-auto">
		Get Started
	</button>
</section>
```

---

## Troubleshooting

### Responsive Classes Not Working

1. **Check class name spelling**: `cyber-md:flex` not `cyber-md-flex`
2. **Verify viewport meta tag**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```
3. **Clear browser cache**: Ctrl+F5

### Layout Breaking on Specific Size

1. Use browser DevTools responsive mode
2. Check element widths with `max-width: 100%`
3. Look for fixed widths that should be responsive

### Text Overflowing

```css
/* Add text wrapping */
.cyber-text-wrap {
	word-wrap: break-word;
	overflow-wrap: break-word;
}
```

---

**Author**: SecuBox Team
**Version**: 1.0.0
**Last Updated**: 2026-01-05
