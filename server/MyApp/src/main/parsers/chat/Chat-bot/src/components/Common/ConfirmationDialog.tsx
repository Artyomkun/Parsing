import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  severity = 'warning',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const getColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'info':
        return 'primary';
      default:
        return 'warning';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color={getColor()} />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color={getColor()}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Загрузка...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Специализированные диалоги
interface DeleteConfirmationDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <ConfirmationDialog
      open={open}
      title="Подтверждение удаления"
      message={`Вы уверены, что хотите удалить "${itemName}"? Это действие нельзя отменить.`}
      confirmText="Удалить"
      severity="error"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
};

interface ArchiveConfirmationDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ArchiveConfirmationDialog: React.FC<ArchiveConfirmationDialogProps> = ({
  open,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <ConfirmationDialog
      open={open}
      title="Подтверждение архивации"
      message={`Вы уверены, что хотите архивировать "${itemName}"?`}
      confirmText="Архивировать"
      severity="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  );
};

export default ConfirmationDialog;