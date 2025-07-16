import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link ,useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '/logo2.png';

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  //로그아웃
  const handleLogout = () => {
    console.log('🚪 로그아웃 버튼 클릭');
    
    // AuthContext의 logout 함수 호출
    logout();
    
    // 메뉴 닫기
    handleMenuClose();
    
    // 로그인 페이지로 리다이렉트
    navigate('/login', { replace: true });
    
    console.log('✅ 로그아웃 완료, 로그인 페이지로 이동');
  };

  //프로필
  const handleProfile = () => {
    console.log('👤 내 정보 클릭');
    handleMenuClose();
    // 프로필 페이지로 이동하거나 모달 열기
    // navigate('/profile');
  };

  return (
    <AppBar position="fixed" elevation={2} sx={{ backgroundColor: '#447A5C' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        {/* 좌측: 로고 + 텍스트 + 메뉴 */}
        <Box display="flex" alignItems="center" gap={1} sx={{ pl: 2 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Box
              component="img"
              src={logo}
              alt="logo"
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Typography
              variant="h6"
              fontWeight="bold"
              color="#fff"
              sx={{ lineHeight: 1, mt: '2px' }}
            >
              사람숲
            </Typography>
          </Link>

          {/* 메뉴 항목들 */}
          <Box display="flex" alignItems="center" gap={3} sx={{ ml: 4, mt: '5px' }}>
            <Link to="/employeepage" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="#fff">직원관리</Typography>
            </Link>
            <Link to="/attendance`" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="#fff">근태관리</Typography>
            </Link>
            <Link to="/approvals" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="#fff">결재관리</Typography>
            </Link>
            <Link to="/payroll" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="#fff">급여관리</Typography>
            </Link>
          </Box>
        </Box>
        


        {/* 우측: 알림 + 유저 드롭다운 */}
        <Box display="flex" alignItems="center" gap={3}>
          <IconButton size="small">
            <NotificationsIcon sx={{ color: '#fff' }} />
          </IconButton>

          <Box onClick={handleMenuClick} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
           <Avatar sx={{ width: 24, height: 24, bgcolor: '#fff', color: '#444', fontSize: 14 }}>
              {user?.name ? user.name.substring(0, 1) : 'U'}
            </Avatar>
            <ArrowDropDownIcon sx={{ color: '#fff' }} />
          </Box>
          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem onClick={handleProfile}>내 정보</MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
              로그아웃
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
