import React from 'react';
import { Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const PaymentPickerDialog = ({ open, onClose, channels, onSelectChannel }) => {
  const handleSelect = (channelId) => {
    onSelectChannel(channelId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>选择支付方式</DialogTitle>
      <List sx={{ pt: 0 }}>
        {(channels || []).map((channel) => (
          <ListItem disableGutters key={channel.id}>
            <ListItemButton onClick={() => handleSelect(channel.id)}>
              <ListItemText primary={channel.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};

export default PaymentPickerDialog;
