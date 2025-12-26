import React, { useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const ClearDataDialogs = React.memo(({ open, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);

  const handleClose = useCallback(() => {
    setStep(1);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    setStep(2);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm();
    handleClose();
  }, [onConfirm, handleClose]);

  if (step === 1) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>确认操作</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要清空所有数据吗？此操作包括所有产品、订单和设置，且无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleNext} color="error">
            我确定
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>最后确认！</DialogTitle>
      <DialogContent>
        <DialogContentText>
          这是最后一次确认。点击下方按钮将 **立即永久删除** 所有应用数据。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>我再想想</Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          删除所有数据
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ClearDataDialogs;
