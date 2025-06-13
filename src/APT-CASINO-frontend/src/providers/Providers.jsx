import React from "react";
import { NFIDAuthProvider } from "./NFIDProvider";
import { NotificationProvider } from "../components/NotificationSystem";
import { BackendIntegrationProvider } from "../contexts/BackendIntegrationContext";

export default function Providers({ children }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <NFIDAuthProvider>
      <BackendIntegrationProvider>
        <NotificationProvider>
          <div className="dark">{children}</div>
        </NotificationProvider>
      </BackendIntegrationProvider>
    </NFIDAuthProvider>
  );
}
