'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function NetworkSwitchModal({
  open,
  onConfirm,
  onCancel,
  online,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  online: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{online ? 'Back Online' : 'You are Offline'}</DialogTitle>
          <DialogDescription>
            {online
              ? 'You are back online. Do you want to switch to the Online Scanner?'
              : 'Your network seems offline. Do you want to switch to the Offline Scanner?'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button onClick={onCancel} variant="outline">
            Stay Here
          </Button>
          <Button onClick={onConfirm}>
            {online ? 'Switch to Online' : 'Switch to Offline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
