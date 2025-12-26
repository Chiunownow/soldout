import React, { useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const ImportConfirmDialog = React.memo(({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>确认导入数据</DialogTitle>
      <DialogContent>
          <DialogContentText>
              您确定要导入备份数据吗？这将 **覆盖** 当前应用中的所有产品、订单和设置。此操作无法撤销。
          </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onConfirm} color="warning">
          确认导入
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ImportConfirmDialog;
