# Futuristic Neubrutalism Theme - Quick Reference

## 🚀 Overview
A bold, cyberpunk-inspired design system that combines brutalist aesthetics with futuristic elements. Features high contrast colors, thick borders, dramatic shadows, and bold typography.

## 🎨 Key Visual Elements

### Colors (Light Mode)
- **Primary**: Electric Purple `oklch(0.6 0.3 270)`
- **Secondary**: Neon Yellow `oklch(0.85 0.15 60)`
- **Accent**: Cyan `oklch(0.7 0.25 180)`
- **Destructive**: Hot Red `oklch(0.65 0.3 15)`
- **Border**: Black `oklch(0.1 0 0)`

### Colors (Dark Mode)
- **Primary**: Bright Cyan `oklch(0.8 0.25 180)`
- **Secondary**: Bright Neon Yellow `oklch(0.9 0.2 60)`
- **Accent**: Hot Pink `oklch(0.75 0.3 300)`
- **Border**: Bright Yellow-White `oklch(0.95 0.02 60)`

## 📏 Core Styling

### Borders & Shadows
```css
border-brutal: 3px solid oklch(0.1 0 0)
shadow-brutal: 4px 4px 0px oklch(0.1 0 0)
shadow-brutal-lg: 8px 8px 0px oklch(0.1 0 0)
```

### Typography
- **Font**: Inter, system-ui, sans-serif
- **Weights**: Bold (700) to Black (900)
- **Style**: UPPERCASE, wide tracking
- **No rounded corners** - sharp edges only

## ⚡ Component Quick Start

### Buttons
```tsx
<Button variant="default">STANDARD ACTION</Button>
<Button variant="cyber">CYBER MODE</Button>
<Button variant="neon" className="neon-glow">NEON EFFECT</Button>
```

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>SYSTEM STATUS</CardTitle>
    <CardDescription>OPERATIONAL</CardDescription>
  </CardHeader>
  <CardContent>Bold content here</CardContent>
</Card>
```

### Forms
```tsx
<Label variant="cyber">USERNAME</Label>
<Input placeholder="ENTER HANDLE" className="font-mono" />
<Textarea placeholder="MISSION BRIEF..." />
```

### Alerts
```tsx
<Alert variant="cyber">
  <AlertTitle>SYSTEM ALERT</AlertTitle>
  <AlertDescription>Status message</AlertDescription>
</Alert>
```

## 🎯 Design Rules

### DO ✅
- Use thick borders (3px+) everywhere
- Apply dramatic shadows
- UPPERCASE text for emphasis
- Bold font weights (600-900)
- Sharp corners (no border-radius)
- High contrast colors
- Transform effects on interaction

### DON'T ❌
- Use subtle effects or gradients
- Apply rounded corners
- Use light font weights
- Create low contrast
- Add decorative elements
- Use gentle animations

## 🔧 Utility Classes

### Special Effects
```css
.shadow-brutal        /* Standard brutal shadow */
.shadow-brutal-lg     /* Large brutal shadow */  
.border-brutal        /* Thick black border */
.text-cyber          /* Cyberpunk text styling */
.neon-glow           /* Neon pulse animation */
.bg-glitch           /* Animated glitch background */
```

### Interactions
```css
hover:translate-x-1 hover:translate-y-1    /* Hover depth */
hover:shadow-brutal-lg                     /* Hover shadow */
active:translate-x-2 active:translate-y-2  /* Active state */
```

## 📱 Component Variants

### Button Variants
`default` | `secondary` | `outline` | `destructive` | `ghost` | `cyber` | `neon` | `link`

### Alert Variants  
`default` | `warning` | `destructive` | `success` | `cyber`

### Badge Variants
`default` | `secondary` | `outline` | `destructive` | `cyber` | `neon` | `ghost`

## 🚀 Usage Example
```tsx
import { Button, Card, CardHeader, CardTitle, Alert } from "@/components/ui";

function CyberInterface() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-black uppercase tracking-brutal text-cyber">
        CYBER TERMINAL
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>SYSTEM STATUS</CardTitle>
        </CardHeader>
      </Card>
      
      <Alert variant="cyber">
        <AlertTitle>READY FOR DEPLOYMENT</AlertTitle>
      </Alert>
      
      <Button variant="neon" className="neon-glow">
        ACTIVATE SYSTEM
      </Button>
    </div>
  );
}
```

## 📚 Files Updated
- `src/index.css` - Complete color system & utilities
- `src/components/ui/button.tsx` - Brutal button styling
- `src/components/ui/card.tsx` - Enhanced card system  
- `src/components/ui/alert.tsx` - Multi-variant alerts
- `src/components/ui/input.tsx` - Cyberpunk input fields
- `src/components/ui/textarea.tsx` - Bold textarea styling
- `src/components/ui/dialog.tsx` - Dramatic modal styling
- `src/components/ui/avatar.tsx` - Sharp avatar design
- `src/components/ui/badge.tsx` - Cyber badge system
- `src/components/ui/label.tsx` - Bold form labels
- `tailwind.config.js` - Extended utilities & animations

**Theme Status: 🟢 FULLY OPERATIONAL**