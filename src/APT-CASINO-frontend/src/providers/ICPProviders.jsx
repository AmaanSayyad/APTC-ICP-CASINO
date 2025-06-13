import React from "react";
import { NFIDAuthProvider } from "./NFIDProvider";
import { NotificationProvider } from "../components/NotificationSystem";

export default function Providers({ children }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <NFIDAuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </NFIDAuthProvider>
  );
}
