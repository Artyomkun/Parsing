import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { User, Role, UserCreateRequest, UserUpdateRequest } from '../../types/user';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useRBAC } from '../../hooks/useRBAC';
import { ConfirmationDialog } from '../Common/ConfirmationDialog';
import { LoadingSpinner } from '../Common/LoadingSpinner';

// Интерфейс для фильтров
interface UserFilters {
  search: string;
  role: string;
  status: string;
}

// Компонент управления пользователями
export const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword
  } = useUserManagement();

  const { hasPermission, user: currentUser } = useRBAC();
  
  // Состояния
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: ''
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Загрузка пользователей при монтировании
  useEffect(() => {
    fetchUsers();
  }, []);

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && user.isActive) ||
      (filters.status === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Обработчики
  const handleCreateUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleSaveUser = async (userData: UserCreateRequest | UserUpdateRequest) => {
    try {
      if (selectedUser) {
        // Обновление пользователя
        await updateUser(selectedUser.id, userData as UserUpdateRequest);
        showSnackbar('Пользователь успешно обновлен', 'success');
      } else {
        // Создание пользователя
        await createUser(userData as UserCreateRequest);
        showSnackbar('Пользователь успешно создан', 'success');
      }
      setDialogOpen(false);
      fetchUsers(); // Обновляем список
    } catch (err) {
      showSnackbar('Ошибка при сохранении пользователя', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      showSnackbar('Пользователь успешно удален', 'success');
      setDeleteDialogOpen(false);
      fetchUsers(); // Обновляем список
    } catch (err) {
      showSnackbar('Ошибка при удалении пользователя', 'error');
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      await resetUserPassword(selectedUser.id);
      showSnackbar('Пароль успешно сброшен', 'success');
      setResetPasswordDialogOpen(false);
    } catch (err) {
      showSnackbar('Ошибка при сбросе пароля', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Проверка прав
  const canManageUsers = hasPermission('user:manage');
  const canDeleteUsers = hasPermission('user:delete');
  const canResetPasswords = hasPermission('user:reset_password');

  if (!canManageUsers) {
    return (
      <Alert severity="error">
        У вас недостаточно прав для управления пользователями
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Управление пользователями
      </Typography>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего пользователей
              </Typography>
              <Typography variant="h5" component="div">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Активные
              </Typography>
              <Typography variant="h5" component="div">
                {users.filter(u => u.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Администраторы
              </Typography>
              <Typography variant="h5" component="div">
                {users.filter(u => u.role === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Заблокированные
              </Typography>
              <Typography variant="h5" component="div">
                {users.filter(u => !u.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по имени, email или username..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Роль</InputLabel>
              <Select
                value={filters.role}
                label="Роль"
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="">Все роли</MenuItem>
                <MenuItem value="admin">Администратор</MenuItem>
                <MenuItem value="manager">Менеджер</MenuItem>
                <MenuItem value="user">Пользователь</MenuItem>
                <MenuItem value="guest">Гость</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                value={filters.status}
                label="Статус"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">Все статусы</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="inactive">Неактивные</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
            <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchUsers()}
                disabled={loading}
                >
                Обновить
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              Добавить пользователя
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Таблица пользователей */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Пользователь</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата регистрации</TableCell>
                <TableCell>Последний вход</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'admin' ? 'secondary' : 'default'}
                      icon={user.role === 'admin' ? <AdminIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Активный' : 'Заблокирован'}
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                      icon={user.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('ru-RU')
                      : 'Никогда'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Редактировать">
                        <span>
                            <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                            disabled={user.id === currentUser?.id}
                            >
                            <EditIcon />
                            </IconButton>
                        </span>
                        </Tooltip>
                        
                        <Tooltip title="Сбросить пароль">
                        <span>
                            <IconButton
                            size="small"
                            onClick={() => handleResetPassword(user)}
                            disabled={!canResetPasswords || user.id === currentUser?.id}
                            >
                            <KeyIcon /> {/* Используем KeyIcon для сброса пароля */}
                            </IconButton>
                        </span>
                        </Tooltip>

                        <Tooltip title="Удалить">
                        <span>
                            <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                            disabled={!canDeleteUsers || user.id === currentUser?.id}
                            >
                            <DeleteIcon />
                            </IconButton>
                        </span>
                        </Tooltip>
                    </Box>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Диалог создания/редактирования пользователя */}
      <UserDialog
        open={dialogOpen}
        user={selectedUser}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUser}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Удаление пользователя"
        message={`Вы уверены, что хотите удалить пользователя ${selectedUser?.firstName} ${selectedUser?.lastName}? Это действие нельзя отменить.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Диалог сброса пароля */}
      <ConfirmationDialog
        open={resetPasswordDialogOpen}
        title="Сброс пароля"
        message={`Сбросить пароль для пользователя ${selectedUser?.firstName} ${selectedUser?.lastName}? Новый пароль будет отправлен на email.`}
        onConfirm={handleConfirmResetPassword}
        onCancel={() => setResetPasswordDialogOpen(false)}
      />

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Компонент диалога создания/редактирования пользователя
interface UserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userData: UserCreateRequest | UserUpdateRequest) => void;
}

const UserDialog: React.FC<UserDialogProps> = ({ open, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'user' as Role,
    isActive: user?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        role: 'user',
        isActive: true
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username обязателен';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username должен содержать минимум 3 символа';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {user ? 'Редактирование пользователя' : 'Создание пользователя'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Имя"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={!!errors.firstName}
            helperText={errors.firstName}
            fullWidth
          />
          <TextField
            label="Фамилия"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={!!errors.lastName}
            helperText={errors.lastName}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />
          <TextField
            label="Username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select
              value={formData.role}
              label="Роль"
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <MenuItem value="user">Пользователь</MenuItem>
              <MenuItem value="manager">Менеджер</MenuItem>
              <MenuItem value="admin">Администратор</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Статус</InputLabel>
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              label="Статус"
              onChange={(e) => handleChange('isActive', e.target.value === 'active')}
            >
              <MenuItem value="active">Активный</MenuItem>
              <MenuItem value="inactive">Заблокирован</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">
          {user ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserManagement;