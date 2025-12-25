import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, FormControlLabel, Checkbox } from '@mui/material';
// Removed: import useLongPress from '../useLongPress'; // No longer needed

const WelcomeDialog = ({ open, onConfirm }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleClickConfirm = () => {
    if (isChecked) {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
    >
      <DialogTitle id="welcome-dialog-title">
        欢迎使用
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="welcome-dialog-description">
          本工具所有数据均存储在您当前使用的浏览器中。这意味着数据不会上传到任何服务器，可离线使用。
        </DialogContentText>
        <DialogContentText color="error" sx={{ mt: 2 }}>
          <strong>重要提示：</strong> 清空浏览器缓存或在其他设备上使用将无法访问现有数据。请谨慎操作。
        </DialogContentText>
        <FormControlLabel
          control={<Checkbox checked={isChecked} onChange={handleCheckboxChange} />}
          label="我已了解数据存储方式和风险"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClickConfirm} // Changed to onClick
          variant="contained"
          disabled={!isChecked}
        >
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeDialog;