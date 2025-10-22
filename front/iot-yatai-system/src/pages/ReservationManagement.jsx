import { Box, Typography, TextField, Button, MenuItem, Card, List, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import ReservationTable from "../component/reservationsTable";

const socket = io("http://127.0.0.1:54321");

const ReservationManagement = () => {
  const [content_id, setContent_id] = useState(1);
  const [time, setTime] = useState("");
  const [done_flg, setDone_flg] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [timeCounts, setTimeCounts] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null); // 受付済みにする対象

  const contentOptions = [
    { id: 1, name: "Arduinoチップで工作体験" },
    { id: 2, name: "プログラミング" },
  ];

  useEffect(() => {
    socket.on("add_reservation_result", (data) => {
      setResponse(data);
    });

    socket.on("reservations_data", (data) => {
      setReservations(data);
      const counts = {};
      data.forEach((r) => {
        counts[r.time] = (counts[r.time] || 0) + 1;
      });
      setTimeCounts(counts);
    });

    return () => {
      socket.off("add_reservation_result");
      socket.off("reservations_data");
    };
  }, []);

  const handleOpenDialog = () => {
    if (!time) {
      setError("時間を選択してください。");
      return;
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleConfirmReservation = () => {
    socket.emit("add_reservation", { content_id, time, done_flg });
    setDialogOpen(false);
  };

  const handleCancelDialog = () => setDialogOpen(false);

  // --- 受付済みにするボタン処理 ---
  const handleOpenUpdateDialog = (reservation) => {
    setSelectedReservation(reservation);
    setUpdateDialogOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (selectedReservation) {
      socket.emit("update_done_flg", { id: selectedReservation.id, done_flg: 1 });
    }
    setUpdateDialogOpen(false);
  };

  const handleCancelUpdate = () => setUpdateDialogOpen(false);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 4, mt: 4 }}>
      {/* 左：予約フォーム */}
      <Card sx={{ paddingBottom: "30px", width: "400px" }}>
        <Typography sx={{ color: "black", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", fontWeight: "bold", my: 2 }}>
          予約フォーム
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <TextField
            select
            label="コンテンツ"
            value={content_id}
            onChange={(e) => setContent_id(Number(e.target.value))}
            sx={{ width: "250px" }}
          >
            {contentOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="時間"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            sx={{ width: "250px" }}
          >
            {Array.from({ length: 24 * 4 }, (_, i) => {
              const hour = Math.floor(i / 4);
              const minuteValue = (i % 4) * 15;
              const hourStr = String(hour).padStart(2, "0");
              const minuteStr = String(minuteValue).padStart(2, "0");
              const value = `${hourStr}:${minuteStr}`;
              if (hour < 9 || (hour === 20 && minuteValue > 0) || hour > 20) return null;
              return <MenuItem key={value} value={value}>{value}</MenuItem>;
            })}
          </TextField>

          <Button variant="contained" onClick={handleOpenDialog}>予約を追加</Button>
          {error && <Typography sx={{ color: "red" }}>{error}</Typography>}
          {response && <Typography sx={{ color: "green" }}>サーバー応答: {JSON.stringify(response)}</Typography>}
        </Box>
      </Card>

      {/* 右：各時間帯の予約数リスト */}
      <Card sx={{ width: "300px", padding: 2 }}>
        <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>時間帯ごとの予約数</Typography>
        <Divider />
        <List dense>
          {Object.entries(timeCounts).sort(([a], [b]) => a.localeCompare(b)).map(([time, count]) => (
            <ListItem key={time}>
              <ListItemText primary={`${time}`} secondary={`${count} 件`} />
            </ListItem>
          ))}
          {Object.keys(timeCounts).length === 0 && <Typography sx={{ textAlign: "center", color: "gray", mt: 2 }}>予約はまだありません</Typography>}
        </List>
      </Card>

      {/* 下部：予約テーブル */}
      <ReservationTable
        socket={socket}
        reservations={reservations}
        onMarkDone={handleOpenUpdateDialog} // 受付済みにするボタンを渡す
      />

      {/* 確認ダイアログ：予約追加 */}
      <Dialog open={dialogOpen} onClose={handleCancelDialog}>
        <DialogTitle>予約確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            以下の予約を追加しますか？<br />
            時間: <strong>{time}</strong><br />
            予約番号: <strong>{reservations.length + 1}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog}>キャンセル</Button>
          <Button onClick={handleConfirmReservation} color="primary">確定</Button>
        </DialogActions>
      </Dialog>

      {/* 確認ダイアログ：受付済みにする */}
      <Dialog open={updateDialogOpen} onClose={handleCancelUpdate}>
        <DialogTitle>受付確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            以下の予約を受付済みにしますか？<br />
            時間: <strong>{selectedReservation?.time}</strong><br />
            予約番号: <strong>{selectedReservation?.id}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdate}>キャンセル</Button>
          <Button onClick={handleConfirmUpdate} color="primary">確定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationManagement;
