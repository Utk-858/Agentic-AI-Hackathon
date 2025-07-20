'use client';

import { useState, useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRouter } from 'next/navigation';
import ChalkboardScannerOnline from '@/components/agents/ChalkboardScannerOnline';
import ChalkboardScannerOffline from '@/components/agents/ChalkboardScannerClient';
import NetworkSwitchModal from '@/components/NetworkSwitchModal';

export default function Page() {
  const { online } = useNetworkStatus();
  const [showModal, setShowModal] = useState(false);
  const prevOnlineRef = useRef<boolean>(online);
  const router = useRouter();

  useEffect(() => {
    // If network changed
    if (prevOnlineRef.current !== online) {
      setShowModal(true);
      prevOnlineRef.current = online;
    }
  }, [online]);

  const handleConfirm = () => {
    setShowModal(false);
    if (online) {
      router.push('/teacher/chalkboard-scanner'); // back online
    } else {
      router.push('/teacher/chalkboard-scanner/offline'); // offline
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <NetworkSwitchModal
        open={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        online={online}
      />

      <div className="p-8">
        {online ? <ChalkboardScannerOnline /> : <ChalkboardScannerOffline />}
      </div>
    </>
  );
}
