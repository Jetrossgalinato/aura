export type AlertVariant = "default" | "success" | "destructive";

export type AlertInput = {
  title: string;
  description?: string;
  variant?: AlertVariant;
  durationMs?: number;
};

export type AlertItem = AlertInput & {
  id: string;
  variant: AlertVariant;
  isClosing?: boolean;
  isVisible?: boolean;
  progress?: number;
};

export type AlertContextValue = {
  showAlert: (alert: AlertInput) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
};
