"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch, SwitchThumb } from "@/components/animate-ui/primitives/base/switch"
import { cn } from "@/lib/utils"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="flex items-center justify-between px-2 py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <div className="relative w-4 h-4">
          <Moon 
            className={`absolute inset-0 text-muted-foreground transition-all duration-300 ${
              theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
            }`}
            size={16}
          />
          <Sun 
            className={`absolute inset-0 text-muted-foreground transition-all duration-300 ${
              theme === "dark" ? "opacity-0 -rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
            size={16}
          />
        </div>
        <span>Theme</span>
      </div>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className={cn(
          "relative flex p-0.5 h-6 w-10 items-center rounded-full border transition-colors duration-200",
          theme === "dark" ? "bg-primary justify-end" : "bg-input justify-start"
        )}
      >
        <SwitchThumb
          className="rounded-full bg-background h-full aspect-square shadow-lg"
          pressedAnimation={{ width: 22 }}
        />
      </Switch>
    </div>
  )
}

