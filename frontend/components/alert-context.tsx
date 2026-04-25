"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AlertVariant = "default" | "destructive";

type AlertInput = {
  title: string;
  description?: string;
  variant?: AlertVariant;
  durationMs?: number;
};

type AlertItem = AlertInput & {
  id: string;
  variant: AlertVariant;
};

type AlertContextValue = {
  showAlert: (alert: AlertInput) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const timeoutHandles = useRef<Map<string, number>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    const timeoutHandle = timeoutHandles.current.get(id);
    if (timeoutHandle !== undefined) {
      window.clearTimeout(timeoutHandle);
      timeoutHandles.current.delete(id);
    }

    setAlerts((previous) => previous.filter((alert) => alert.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    timeoutHandles.current.forEach((timeoutHandle) => {
      window.clearTimeout(timeoutHandle);
    });
    timeoutHandles.current.clear();
    setAlerts([]);
  }, []);

  const showAlert = useCallback(
    ({ durationMs = 5000, variant = "default", ...alert }: AlertInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      setAlerts((previous) => [
        ...previous,
        { id, variant, durationMs, ...alert },
      ]);

      if (durationMs > 0) {
        const timeoutHandle = window.setTimeout(() => {
          dismissAlert(id);
        }, durationMs);
        timeoutHandles.current.set(id, timeoutHandle);
      }

      return id;
    },
    [dismissAlert],
  );

  useEffect(() => {
    const timeouts = timeoutHandles.current;

    return () => {
      timeouts.forEach((timeoutHandle) => {
        window.clearTimeout(timeoutHandle);
      });
      timeouts.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ showAlert, dismissAlert, clearAlerts }),
    [showAlert, dismissAlert, clearAlerts],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            className="pointer-events-auto shadow-md"
          >
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.description ? (
              <AlertDescription>{alert.description}</AlertDescription>
            ) : null}
            <AlertAction>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="Dismiss alert"
                onClick={() => dismissAlert(alert.id)}
              >
                <X />
              </Button>
            </AlertAction>
          </Alert>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider.");
  }

  return context;
}
