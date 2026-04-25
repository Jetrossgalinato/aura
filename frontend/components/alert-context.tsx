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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "success" | "destructive";

type AlertInput = {
  title: string;
  description?: string;
  variant?: AlertVariant;
  durationMs?: number;
};

type AlertItem = AlertInput & {
  id: string;
  variant: AlertVariant;
  isClosing?: boolean;
  isVisible?: boolean;
  progress?: number;
};

type AlertContextValue = {
  showAlert: (alert: AlertInput) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const autoDismissHandles = useRef<Map<string, number>>(new Map());
  const removalHandles = useRef<Map<string, number>>(new Map());
  const progressHandles = useRef<Map<string, number>>(new Map());

  const removeAlert = useCallback((id: string) => {
    const autoDismissHandle = autoDismissHandles.current.get(id);
    if (autoDismissHandle !== undefined) {
      window.clearTimeout(autoDismissHandle);
      autoDismissHandles.current.delete(id);
    }

    const progressHandle = progressHandles.current.get(id);
    if (progressHandle !== undefined) {
      window.clearInterval(progressHandle);
      progressHandles.current.delete(id);
    }

    const removalHandle = removalHandles.current.get(id);
    if (removalHandle !== undefined) {
      window.clearTimeout(removalHandle);
      removalHandles.current.delete(id);
    }

    setAlerts((previous) => previous.filter((alert) => alert.id !== id));
  }, []);

  const animateAlertIn = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === id ? { ...alert, isVisible: true } : alert,
        ),
      );
    });
  }, []);

  const dismissAlert = useCallback(
    (id: string) => {
      const removalHandle = removalHandles.current.get(id);
      if (removalHandle !== undefined) {
        return;
      }

      const autoDismissHandle = autoDismissHandles.current.get(id);
      if (autoDismissHandle !== undefined) {
        window.clearTimeout(autoDismissHandle);
        autoDismissHandles.current.delete(id);
      }

      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === id ? { ...alert, isClosing: true } : alert,
        ),
      );

      const removalTimeout = window.setTimeout(() => {
        removeAlert(id);
      }, 180);

      removalHandles.current.set(id, removalTimeout);
    },
    [removeAlert],
  );

  const clearAlerts = useCallback(() => {
    autoDismissHandles.current.forEach((timeoutHandle) => {
      window.clearTimeout(timeoutHandle);
    });
    autoDismissHandles.current.clear();

    progressHandles.current.forEach((intervalHandle) => {
      window.clearInterval(intervalHandle);
    });
    progressHandles.current.clear();

    removalHandles.current.forEach((timeoutHandle) => {
      window.clearTimeout(timeoutHandle);
    });
    removalHandles.current.clear();

    setAlerts((previous) => {
      previous.forEach((alert) => {
        const removalTimeout = window.setTimeout(() => {
          removeAlert(alert.id);
        }, 180);

        removalHandles.current.set(alert.id, removalTimeout);
      });

      return previous.map((alert) => ({ ...alert, isClosing: true }));
    });
  }, [removeAlert]);

  const showAlert = useCallback(
    ({ durationMs = 5000, variant = "default", ...alert }: AlertInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const shouldTrackProgress = durationMs > 0;

      setAlerts((previous) => [
        ...previous,
        {
          id,
          variant,
          durationMs,
          ...alert,
          isVisible: false,
          progress: shouldTrackProgress ? 0 : undefined,
        },
      ]);

      animateAlertIn(id);

      if (shouldTrackProgress) {
        const startTime = window.performance.now();
        const intervalHandle = window.setInterval(() => {
          const elapsed = window.performance.now() - startTime;
          const nextProgress = Math.min((elapsed / durationMs) * 100, 100);

          setAlerts((previous) =>
            previous.map((currentAlert) =>
              currentAlert.id === id
                ? { ...currentAlert, progress: nextProgress }
                : currentAlert,
            ),
          );

          if (nextProgress >= 100) {
            window.clearInterval(intervalHandle);
            progressHandles.current.delete(id);
          }
        }, 50);

        progressHandles.current.set(id, intervalHandle);
      }

      if (durationMs > 0) {
        const timeoutHandle = window.setTimeout(() => {
          dismissAlert(id);
        }, durationMs);
        autoDismissHandles.current.set(id, timeoutHandle);
      }

      return id;
    },
    [animateAlertIn, dismissAlert],
  );

  useEffect(() => {
    const autoDismissTimeouts = autoDismissHandles.current;
    const progressIntervals = progressHandles.current;
    const removalTimeouts = removalHandles.current;

    return () => {
      autoDismissTimeouts.forEach((timeoutHandle) => {
        window.clearTimeout(timeoutHandle);
      });
      autoDismissTimeouts.clear();

      progressIntervals.forEach((intervalHandle) => {
        window.clearInterval(intervalHandle);
      });
      progressIntervals.clear();

      removalTimeouts.forEach((timeoutHandle) => {
        window.clearTimeout(timeoutHandle);
      });
      removalTimeouts.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ showAlert, dismissAlert, clearAlerts }),
    [showAlert, dismissAlert, clearAlerts],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-18 z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            className={cn(
              "pointer-events-auto shadow-md transition-all duration-200 ease-out motion-reduce:transition-none",
              alert.isClosing
                ? "opacity-0 translate-x-4"
                : alert.isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4",
            )}
          >
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.description ? (
              <AlertDescription>{alert.description}</AlertDescription>
            ) : null}
            {alert.progress !== undefined ? (
              <div className="absolute bottom-0 left-0 w-full overflow-hidden rounded-b-lg">
                <Progress className="rounded-none h-1" value={alert.progress} />
              </div>
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
