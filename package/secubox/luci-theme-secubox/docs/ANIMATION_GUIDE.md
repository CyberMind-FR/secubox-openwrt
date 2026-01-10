# SecuBox Animation System Guide

Complete guide to using animations and micro-interactions in SecuBox.

## Table of Contents
1. [Animation Categories](#animation-categories)
2. [Utility Classes](#utility-classes)
3. [JavaScript API](#javascript-api)
4. [Creating Custom Animations](#creating-custom-animations)
5. [Performance Best Practices](#performance-best-practices)
6. [Animation Reference](#animation-reference)

---

## Animation Categories

SecuBox provides 60+ pre-built animations organized in 8 categories:

### 1. Entrance Animations

Animations for elements appearing on screen.

| Animation | Description | Duration |
|-----------|-------------|----------|
| `cyber-fade-in` | Fade opacity 0→1 | 0.3s |
| `cyber-zoom-in` | Scale 0.8→1 with fade | 0.3s |
| `cyber-slide-in-left` | Slide from left | 0.3s |
| `cyber-slide-in-right` | Slide from right | 0.3s |
| `cyber-slide-up` | Slide from bottom | 0.3s |
| `cyber-slide-down` | Slide from top | 0.3s |
| `cyber-bounce-in` | Bounce scale effect | 0.5s |
| `cyber-rotate-in` | Rotate + scale in | 0.5s |
| `cyber-flip-in-x` | 3D flip on X axis | 0.5s |
| `cyber-flip-in-y` | 3D flip on Y axis | 0.5s |
| `cyber-roll-in` | Roll in from left | 0.5s |

**Usage**:
```html
<div class="cyber-animate-fade-in">Content</div>
```

---

### 2. Exit Animations

Animations for elements leaving the screen.

| Animation | Description |
|-----------|-------------|
| `cyber-fade-out` | Fade opacity 1→0 |
| `cyber-zoom-out` | Scale 1→0.8 with fade |
| `cyber-slide-out-right` | Slide out to right |

---

### 3. Attention Seekers

Animations to draw attention to elements.

| Animation | Description | Loop |
|-----------|-------------|------|
| `cyber-flash` | Rapid opacity flash | No |
| `cyber-heartbeat` | Pulse scale (2 beats) | Yes |
| `cyber-rubber-band` | Elastic stretch | No |
| `cyber-jello` | Skew wobble | No |
| `cyber-swing` | Rotate swing | No |
| `cyber-tada` | Scale + rotate celebration | No |
| `cyber-wobble` | Horizontal wobble | No |
| `cyber-headshake` | Horizontal shake (subtle) | No |
| `cyber-shake` | Aggressive horizontal shake | No |

**Example**:
```html
<button class="cyber-btn cyber-animate-heartbeat">
	Important Action
</button>
```

---

### 4. Loading Animations

Continuous animations for loading states.

| Animation | Description |
|-----------|-------------|
| `cyber-spin` | 360° rotation |
| `cyber-pulse` | Scale pulsing |
| `cyber-pulse-ring` | Expanding ring effect |
| `cyber-dots` | Opacity fade cycle |
| `cyber-shimmer` | Gradient sweep |

**Built-in Loading Components**:

```html
<!-- Spinner -->
<div class="cyber-spinner"></div>

<!-- Skeleton loader -->
<div class="cyber-skeleton" style="width: 200px; height: 20px;"></div>

<!-- Pulsing dot -->
<span class="cyber-dot-pulse"></span>
```

---

### 5. Continuous Animations

Subtle continuous animations.

| Animation | Description |
|-----------|-------------|
| `cyber-float` | Gentle up/down float |
| `cyber-bounce-continuous` | Continuous bouncing |

**Example**:
```html
<div class="cyber-animate-float">
	Floating element
</div>
```

---

### 6. Interactive Animations

Triggered by user interaction.

| Animation | Use Case |
|-----------|----------|
| `cyber-click` | Button press feedback |
| `cyber-glow-pulse` | Hover glow effect |
| `cyber-wiggle` | Playful hover |

**Auto-Applied**:
```html
<!-- Auto-animated on :active -->
<button class="cyber-btn">Click Me</button>

<!-- Auto-animated on :hover -->
<div class="cyber-card-hover">Card</div>
```

---

### 7. Data Visualization

Animations for charts and metrics.

| Animation | Description |
|-----------|-------------|
| `cyber-bar-fill` | Progress bar fill |
| `cyber-counter-up` | Number count-up |
| `cyber-progress-fill` | Scale-based fill |

---

### 8. Page Transitions

Smooth page/content transitions.

| Animation | Description |
|-----------|-------------|
| `cyber-page-enter` | Fade + slide up |
| `cyber-page-exit` | Fade + slide up (reverse) |

**Classes**:
```css
.cyber-page-transition-enter
.cyber-page-transition-exit
```

---

## Utility Classes

### Direct Animation Classes

Apply animations directly via class:

```html
<div class="cyber-animate-fade-in">Fades in</div>
<div class="cyber-animate-zoom-in">Zooms in</div>
<div class="cyber-animate-bounce-in">Bounces in</div>
<div class="cyber-animate-slide-in-left">Slides in from left</div>
<div class="cyber-animate-rotate-in">Rotates in</div>
```

### Hover Micro-Interactions

```html
<!-- Lift on hover -->
<div class="cyber-hover-lift">Lifts up</div>

<!-- Grow on hover -->
<div class="cyber-hover-grow">Grows slightly</div>

<!-- Shrink on hover -->
<div class="cyber-hover-shrink">Shrinks slightly</div>

<!-- Rotate on hover -->
<div class="cyber-hover-rotate">Rotates 5°</div>

<!-- Glow on hover -->
<div class="cyber-hover-glow-accent">Glows</div>
```

### Transition Utilities

Control transition speed:

```css
.cyber-transition-fast   /* 0.15s */
.cyber-transition-base   /* 0.3s */
.cyber-transition-slow   /* 0.5s */
```

**Example**:
```html
<button class="cyber-btn cyber-transition-fast">
	Fast transitions
</button>
```

### List Stagger

Animate list items with delay:

```html
<ul class="cyber-list-stagger">
	<li>Item 1 (0.05s delay)</li>
	<li>Item 2 (0.1s delay)</li>
	<li>Item 3 (0.15s delay)</li>
	<li>Item 4 (0.2s delay)</li>
</ul>
```

---

## JavaScript API

### Theme.js Animation Methods

```javascript
'use strict';
'require secubox-theme.theme as Theme';

// Animate page transition
Theme.animatePageTransition(oldContent, newContent, {
	duration: 400,
	exitDuration: 300
}).then(function() {
	console.log('Transition complete');
});

// Apply entrance animation
Theme.animateEntrance(element, 'zoom-in');

// Apply micro-interaction
Theme.applyMicroInteraction(element, 'shake');
```

### animatePageTransition()

Smooth transition between page content.

```javascript
var oldContent = document.getElementById('old-page');
var newContent = document.getElementById('new-page');

Theme.animatePageTransition(oldContent, newContent, {
	duration: 400,        // Enter animation duration (ms)
	exitDuration: 300     // Exit animation duration (ms)
}).then(function() {
	// Transition complete
});
```

**How it works**:
1. Adds exit animation to old content
2. Removes old content after `exitDuration`
3. Adds enter animation to new content
4. Resolves promise after `duration`

---

### animateEntrance()

Apply entrance animation to element.

```javascript
var element = document.getElementById('my-element');

// Available types: fade-in, zoom-in, slide-in-left, slide-in-right, bounce-in, rotate-in
Theme.animateEntrance(element, 'bounce-in');
```

**Auto-cleanup**: Animation class is automatically removed after completion.

---

### applyMicroInteraction()

Trigger attention-seeking animation.

```javascript
var button = document.querySelector('.submit-btn');

// Available types: shake, wobble, tada, jello, swing, flash, heartbeat, rubberBand
Theme.applyMicroInteraction(button, 'tada');
```

**Use cases**:
- Form validation errors → `shake`
- Success confirmation → `tada`
- Important notification → `heartbeat`

---

## Creating Custom Animations

### Step 1: Define Keyframes

Add to `core/animations.css`:

```css
@keyframes cyber-my-custom-animation {
	0% {
		opacity: 0;
		transform: translateX(-100px) rotate(-45deg);
	}
	50% {
		opacity: 1;
		transform: translateX(10px) rotate(5deg);
	}
	100% {
		opacity: 1;
		transform: translateX(0) rotate(0deg);
	}
}
```

### Step 2: Create Utility Class

```css
.cyber-animate-my-custom {
	animation: cyber-my-custom-animation 0.6s ease-out;
}
```

### Step 3: Use Animation

```html
<div class="cyber-animate-my-custom">
	Animated element
</div>
```

### Advanced: Conditional Animations

```css
/* Animate only on first load */
.first-load .cyber-card {
	animation: cyber-zoom-in 0.5s ease-out;
}

/* Animate on state change */
.success-state {
	animation: cyber-tada 0.5s ease-out;
}
```

---

## Performance Best Practices

### 1. Use Transform & Opacity

**✅ Good** - GPU-accelerated:
```css
@keyframes good-animation {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
```

**❌ Bad** - CPU-heavy:
```css
@keyframes bad-animation {
	from {
		top: 100px;
		left: 0px;
	}
	to {
		top: 0px;
		left: 100px;
	}
}
```

### 2. Limit Simultaneous Animations

```javascript
// ✅ Good: Stagger animations
elements.forEach(function(el, i) {
	setTimeout(function() {
		el.classList.add('cyber-animate-fade-in');
	}, i * 100);
});

// ❌ Bad: All at once
elements.forEach(function(el) {
	el.classList.add('cyber-animate-fade-in');
});
```

### 3. Remove Animation Classes

```javascript
// Auto-remove after animation completes
element.addEventListener('animationend', function handler() {
	element.classList.remove('cyber-animate-bounce-in');
	element.removeEventListener('animationend', handler);
});
```

### 4. Use will-change Sparingly

```css
/* ✅ Good: Only during animation */
.cyber-animate-zoom-in {
	will-change: transform, opacity;
	animation: cyber-zoom-in 0.3s ease-out;
}

/* ❌ Bad: Always on */
.my-element {
	will-change: transform, opacity;
}
```

### 5. Reduce Motion for Accessibility

```css
@media (prefers-reduced-motion: reduce) {
	* {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

---

## Animation Reference

### Complete Keyframes List

#### Entrance
- `cyber-fade-in`
- `cyber-fade-out`
- `cyber-zoom-in`
- `cyber-zoom-out`
- `cyber-slide-up`
- `cyber-slide-down`
- `cyber-slide-in-left`
- `cyber-slide-in-right`
- `cyber-slide-out-right`
- `cyber-bounce-in`
- `cyber-rotate-in`
- `cyber-flip-in-x`
- `cyber-flip-in-y`
- `cyber-roll-in`

#### Attention
- `cyber-flash`
- `cyber-heartbeat`
- `cyber-rubber-band`
- `cyber-jello`
- `cyber-swing`
- `cyber-tada`
- `cyber-wobble`
- `cyber-headshake`
- `cyber-shake`
- `cyber-wiggle`

#### Loading
- `cyber-spin`
- `cyber-pulse`
- `cyber-pulse-ring`
- `cyber-dots`
- `cyber-shimmer`

#### Continuous
- `cyber-float`
- `cyber-bounce-continuous`

#### Interactive
- `cyber-click`
- `cyber-glow-pulse`

#### Data Viz
- `cyber-bar-fill`
- `cyber-counter-up`
- `cyber-progress-fill`

#### Background
- `cyber-gradient`
- `cyber-grid-scan`
- `cyber-wave`
- `cyber-particles`

#### Page Transitions
- `cyber-page-enter`
- `cyber-page-exit`

#### Modal/Tooltip
- `cyber-modal-overlay-in`
- `cyber-modal-overlay-out`
- `cyber-modal-content-in`
- `cyber-modal-content-out`
- `cyber-tooltip-in`

#### Form
- `cyber-input-focus`
- `cyber-input-error`

#### Text
- `cyber-text-flicker`

#### Badge
- `cyber-badge-pop`

#### Progress
- `cyber-progress-indeterminate`

---

## Common Use Cases

### 1. Loading State

```html
<div id="content" class="cyber-skeleton" style="height: 200px;">
	<!-- Loading... -->
</div>

<script>
	fetch('/api/data').then(function(data) {
		var content = document.getElementById('content');
		content.classList.remove('cyber-skeleton');
		content.innerHTML = data.html;
		Theme.animateEntrance(content, 'fade-in');
	});
</script>
```

### 2. Form Validation Error

```javascript
function showError(inputElement) {
	inputElement.classList.add('cyber-input-error');
	Theme.applyMicroInteraction(inputElement, 'shake');

	setTimeout(function() {
		inputElement.classList.remove('cyber-input-error');
	}, 3000);
}
```

### 3. Success Notification

```javascript
function showSuccess(message) {
	var notification = E('div', { 'class': 'cyber-notification-enter' }, [
		E('div', { 'class': 'notification-icon' }, '✓'),
		E('div', {}, message)
	]);

	document.body.appendChild(notification);

	setTimeout(function() {
		notification.classList.add('cyber-notification-exit');
		setTimeout(function() {
			notification.remove();
		}, 300);
	}, 3000);
}
```

### 4. Dynamic List Items

```javascript
function addListItem(text) {
	var list = document.querySelector('.my-list');
	var item = E('li', { 'class': 'cyber-animate-slide-in-left' }, text);

	list.appendChild(item);

	// Auto-remove animation class
	item.addEventListener('animationend', function() {
		item.classList.remove('cyber-animate-slide-in-left');
	});
}
```

### 5. Page Navigation

```javascript
function navigateToPage(newPageUrl) {
	var oldContent = document.getElementById('main-content');

	fetch(newPageUrl).then(function(html) {
		var newContent = document.createElement('div');
		newContent.innerHTML = html;
		newContent.id = 'main-content';

		Theme.animatePageTransition(oldContent, newContent).then(function() {
			// Replace old content with new
			oldContent.parentNode.replaceChild(newContent, oldContent);
		});
	});
}
```

---

## Troubleshooting

### Animation Not Playing

1. **Check class name**: `cyber-animate-fade-in` not `cyber-fade-in-animate`
2. **Verify CSS is loaded**: Check browser DevTools
3. **Animation already played**: Remove class and re-add
4. **Conflicting CSS**: Check for `animation: none` rules

### Animation Too Fast/Slow

Customize duration:

```css
.my-element {
	animation: cyber-fade-in 1s ease-out;  /* Override duration */
}
```

### Animation Janky/Stuttering

1. Use `transform` and `opacity` only
2. Reduce number of simultaneous animations
3. Check browser performance (DevTools → Performance)
4. Avoid animating `width`, `height`, `top`, `left`

### Animation Doesn't Restart

Remove and re-add class:

```javascript
element.classList.remove('cyber-animate-bounce-in');
// Force reflow
void element.offsetWidth;
element.classList.add('cyber-animate-bounce-in');
```

---

## Advanced Techniques

### Chaining Animations

```javascript
element.addEventListener('animationend', function handler1() {
	element.classList.remove('cyber-animate-zoom-in');
	element.classList.add('cyber-animate-bounce-in');

	element.addEventListener('animationend', function handler2() {
		element.classList.remove('cyber-animate-bounce-in');
		element.removeEventListener('animationend', handler2);
	});

	element.removeEventListener('animationend', handler1);
});
```

### Dynamic Animation Parameters

```javascript
element.style.setProperty('--animation-duration', '0.5s');
element.style.setProperty('--animation-delay', '0.2s');

// In CSS:
.my-element {
	animation: cyber-fade-in var(--animation-duration, 0.3s) ease-out var(--animation-delay, 0s);
}
```

### Intersection Observer for Scroll Animations

```javascript
var observer = new IntersectionObserver(function(entries) {
	entries.forEach(function(entry) {
		if (entry.isIntersecting) {
			entry.target.classList.add('cyber-animate-fade-in');
			observer.unobserve(entry.target);
		}
	});
});

document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
	observer.observe(el);
});
```

---

**Author**: SecuBox Team
**Version**: 1.0.0
**Last Updated**: 2026-01-05
