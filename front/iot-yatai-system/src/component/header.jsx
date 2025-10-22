// Header.jsx
import { Button, AppBar, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function Header() {
  return (
    <AppBar position="static">
      <Stack direction="row">
        <Link to="/Reservation_Show" style={{ textDecoration: "none" }}>
          <Button>
            <Typography sx={{ color: "white" }}>予約表示</Typography>
          </Button>
        </Link>
        <Link to="/Reservation_Management" style={{ textDecoration: "none" }}>
          <Button>
            <Typography sx={{ color: "white" }}>予約管理</Typography>
          </Button>
        </Link>
        <Link to="/Call" style={{ textDecoration: "none" }}>
          <Button>
            <Typography sx={{ color: "white" }}>お呼び出し</Typography>
          </Button>
        </Link>
        <Link to="/Purchase" style={{ textDecoration: "none" }}>
          <Button>
            <Typography sx={{ color: "white" }}>購入手続き</Typography>
          </Button>
        </Link>
      </Stack>
    </AppBar>
  );
}

export default Header;
