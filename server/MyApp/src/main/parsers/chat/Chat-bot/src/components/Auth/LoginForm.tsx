import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const { isDark } = useTheme();

  // Состояния формы
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  // Получаем redirect путь из location state
  const from = (location.state as any)?.from?.pathname || '/chat';

  // Очищаем ошибки при изменении полей
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData.username, formData.password]);

  // Валидация формы
  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      errors.username = 'Email или имя пользователя обязательно';
    }

    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Обработчики изменений
  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Очищаем ошибку поля при изменении
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  // Обработчик отправки формы
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setTouched({
      username: true,
      password: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        // Вызываем колбэк onSuccess если передан
        onSuccess?.();
        // Перенаправляем на предыдущую страницу или на чат
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Ошибка уже обработана в useAuth хуке
      console.error('Login error:', err);
    }
  };

  // Быстрый вход для демонстрации (только для разработки)
  const handleQuickLogin = (type: 'user' | 'admin') => {
    const credentials = {
      user: { username: 'demo@example.com', password: 'demopassword' },
      admin: { username: 'admin@example.com', password: 'adminpassword' },
    };

    setFormData(credentials[type]);
  };

  const getFieldError = (field: keyof LoginFormData): string | undefined => {
    return touched[field] ? formErrors[field] : undefined;
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Заголовок */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
            }}
          >
            <LoginIcon
              sx={{
                fontSize: 48,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography
              component="h1"
              variant="h4"
              fontWeight="bold"
              gutterBottom
            >
              Вход в систему
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Введите ваши учетные данные для доступа к чат-боту
            </Typography>
          </Box>

          {/* Форма */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            {/* Поле email/username */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Email или имя пользователя"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleInputChange('username')}
              onBlur={handleBlur('username')}
              error={!!getFieldError('username')}
              helperText={getFieldError('username')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
            />

            {/* Поле пароля */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange('password')}
              onBlur={handleBlur('password')}
              error={!!getFieldError('password')}
              helperText={getFieldError('password')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
            />

            {/* Ссылка на восстановление пароля */}
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Button
                onClick={onForgotPassword}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
                disabled={isLoading}
              >
                Забыли пароль?
              </Button>
            </Box>

            {/* Ошибка авторизации */}
            {error && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            {/* Кнопка входа */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <LoginIcon sx={{ mr: 1 }} />
                  Войти
                </>
              )}
            </Button>

            {/* Разделитель */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                или
              </Typography>
            </Divider>

            {/* Быстрый вход для демо */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  mb={1}
                >
                  Демо доступ:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickLogin('user')}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    Демо пользователь
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    Демо администратор
                  </Button>
                </Box>
              </Box>
            )}

            {/* Ссылка на регистрацию */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Еще нет аккаунта?{' '}
                <Button
                  onClick={onSwitchToRegister}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                  disabled={isLoading}
                >
                  Зарегистрироваться
                </Button>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

// Компонент для страницы входа
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleLoginSuccess = () => {
    // Дополнительные действия после успешного входа
    console.log('Login successful!');
  };

  return (
    <LoginForm
      onSuccess={handleLoginSuccess}
      onSwitchToRegister={handleSwitchToRegister}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default LoginForm;