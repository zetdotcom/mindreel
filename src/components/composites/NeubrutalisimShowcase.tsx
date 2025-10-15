import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Rocket, Shield, Terminal, Cpu, Binary } from "lucide-react";

export function NeubrutalistShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-black uppercase tracking-brutal text-cyber text-shadow-brutal-lg">
          Futuristic Neubrutalism
        </h1>
        <p className="text-xl font-bold uppercase tracking-wide text-muted-foreground">
          Bold • Angular • Cyberpunk • Uncompromising
        </p>
      </div>

      {/* Color Palette Display */}
      <Card className="bg-glitch">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="size-6" />
            Color System
          </CardTitle>
          <CardDescription>
            High-contrast cyberpunk palette with brutal styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-primary border-brutal shadow-brutal"></div>
              <p className="text-xs font-bold uppercase">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary border-brutal shadow-brutal"></div>
              <p className="text-xs font-bold uppercase">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent border-brutal shadow-brutal"></div>
              <p className="text-xs font-bold uppercase">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-destructive border-brutal shadow-brutal"></div>
              <p className="text-xs font-bold uppercase">Destructive</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Terminal className="size-6" />
            Button System
          </CardTitle>
          <CardDescription>
            Bold, interactive elements with brutal shadows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outlined</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="cyber">Cyber Mode</Button>
            <Button variant="neon" className="neon-glow">Neon Effect</Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button variant="default" size="icon">
              <Rocket className="size-4" />
            </Button>
            <Button variant="secondary" size="icon">
              <Shield className="size-4" />
            </Button>
            <Button variant="cyber" size="icon-lg">
              <Cpu className="size-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Variations */}
      <div className="space-y-4">
        <h2 className="text-3xl font-black uppercase tracking-wide">Alert System</h2>

        <Alert variant="default">
          <Terminal className="size-5" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>
            All systems operational. Neubrutalism theme active.
          </AlertDescription>
        </Alert>

        <Alert variant="warning">
          <Zap className="size-5" />
          <AlertTitle>Warning Protocol</AlertTitle>
          <AlertDescription>
            High energy detected. Proceed with caution.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <Shield className="size-5" />
          <AlertTitle>Critical Error</AlertTitle>
          <AlertDescription>
            System breach detected. Immediate action required.
          </AlertDescription>
        </Alert>

        <Alert variant="cyber">
          <Binary className="size-5" />
          <AlertTitle>Cyber Mode Activated</AlertTitle>
          <AlertDescription>
            Enhanced cyberpunk styling is now active.
          </AlertDescription>
        </Alert>
      </div>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Cpu className="size-6" />
            Input System
          </CardTitle>
          <CardDescription>
            Brutalist form elements with cyber aesthetics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wide">
                Username
              </label>
              <Input
                placeholder="Enter your handle"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wide">
                Access Code
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide">
              Mission Brief
            </label>
            <Textarea
              placeholder="Describe your cyber mission..."
              className="font-mono"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Avatar Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="size-6" />
            Avatar System
          </CardTitle>
          <CardDescription>
            Cyber warrior profile displays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <Avatar className="size-12">
              <AvatarImage src="/api/placeholder/48/48" alt="Cyber Warrior" />
              <AvatarFallback>CW</AvatarFallback>
            </Avatar>

            <Avatar className="size-16">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                NX
              </AvatarFallback>
            </Avatar>

            <Avatar className="size-20">
              <AvatarFallback className="bg-accent text-accent-foreground">
                ZR
              </AvatarFallback>
            </Avatar>

            <Avatar className="size-24">
              <AvatarFallback className="bg-destructive text-destructive-foreground">
                ER
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Dialog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Binary className="size-6" />
            Dialog System
          </CardTitle>
          <CardDescription>
            Modal interfaces with brutal styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="cyber" size="lg">
                Launch Cyber Dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cyber Interface Access</DialogTitle>
                <DialogDescription>
                  You are accessing a secured cyber interface. Proceed with authentication.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input placeholder="Enter biometric data" className="font-mono" />
                <Textarea
                  placeholder="Enter mission parameters..."
                  rows={3}
                  className="font-mono"
                />
              </div>

              <DialogFooter className="gap-3">
                <Button variant="outline">Cancel</Button>
                <Button variant="cyber">Authenticate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Typography Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Rocket className="size-6" />
            Typography System
          </CardTitle>
          <CardDescription>
            Bold, angular text with cyber aesthetics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-brutal text-cyber">
              Cyber Heading 1
            </h1>
            <h2 className="text-4xl font-black uppercase tracking-wide">
              System Heading 2
            </h2>
            <h3 className="text-3xl font-bold uppercase tracking-wide">
              Interface Heading 3
            </h3>
            <h4 className="text-2xl font-bold uppercase">
              Module Heading 4
            </h4>
          </div>

          <div className="space-y-2">
            <p className="text-base font-semibold">
              Standard body text with enhanced weight for better visibility in the brutal aesthetic.
            </p>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Small caps text for secondary information
            </p>
            <p className="font-mono text-sm font-bold">
              [SYSTEM] Monospace text for code and technical readouts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8 border-t-brutal">
        <p className="text-lg font-bold uppercase tracking-wide text-muted-foreground">
          Futuristic Neubrutalism Theme • Ready for Deployment
        </p>
      </div>
    </div>
  );
}
