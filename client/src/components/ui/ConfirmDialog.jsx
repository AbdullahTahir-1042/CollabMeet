import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { p: 1 } }}
    aria-labelledby="confirm-dialog-title"
  >
    <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 700 }}>
      {title}
    </DialogTitle>
    {description ? (
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
    ) : null}
    <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
      <Button onClick={onClose} color="inherit" autoFocus={danger}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color={danger ? 'error' : 'primary'}
        autoFocus={!danger}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
