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
import {
  generateAlertId,
  calculateProgress,
  ALERT_TIMINGS,
} from "@/lib/alert-utils";

import type { AlertContextValue, AlertInput, AlertItem } from "@/types/alert";

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
      }, ALERT_TIMINGS.SLIDE_OUT_DURATION);

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

    // Pure state update: only mark alerts as closing
    setAlerts((previous) =>
      previous.map((alert) => ({ ...alert, isClosing: true })),
    );

    // Schedule removal side-effect after state is set
    window.setTimeout(() => {
      setAlerts((previous) => {
        const closingAlerts = previous.filter((alert) => alert.isClosing);
        closingAlerts.forEach((alert) => {
          removeAlert(alert.id);
        });
        return previous;
      });
    }, ALERT_TIMINGS.SLIDE_OUT_DURATION);
  }, [removeAlert]);

  const showAlert = useCallback(
    ({
      durationMs = ALERT_TIMINGS.AUTO_DISMISS_DURATION,
      variant = "default",
      ...alert
    }: AlertInput) => {
      const id = generateAlertId();
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
          const nextProgress = calculateProgress(elapsed, durationMs);

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
        }, ALERT_TIMINGS.PROGRESS_UPDATE_INTERVAL);

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

      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed right-4 top-18 z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            className={cn(
              "pointer-events-auto shadow-md motion-reduce:animation-none",
              alert.isClosing
                ? "alert-slide-out"
                : alert.isVisible
                  ? "alert-slide-in"
                  : "opacity-0 translate-x-4", // Initial hidden state before animation starts
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
