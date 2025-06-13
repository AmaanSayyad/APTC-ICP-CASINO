import { useEffect, useRef } from "react";
// Rainbow Kit imports removed - ICP only mode
// import { useAccount, useDisconnect } from "wagmi";
// import "@rainbow-me/rainbowkit/styles.css";
import { useNavigate } from "react-router-dom";

export default function LaunchGameButton() {
  const navigate = useNavigate();
  // const { isConnecting, address, isConnected, chain } = useAccount();
  // const { openConnectModal } = useConnectModal();
  // const { openAccountModal } = useAccountModal();
  // const { openChainModal } = useChainModal();
  // const { disconnect } = useDisconnect();

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);
  return (
    <a
      className="text-white font-display cursor-pointer rounded-xl py-3 px-6 smooth-gradient"
      type="button"
      href="/game"
    >
      Launch game
    </a>
  );
}
