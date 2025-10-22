import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useState, useEffect } from "react";

const ReservationTable = ({ socket }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markDoneDialogOpen, setMarkDoneDialogOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);

  const contentMap = {
    1: "Arduinoチップで工作体験",
    2: "プログラミング体験",
  };

  useEffect(() => {
    socket.emit("get_reservations");

    socket.on("reservations_data", (data) => {
      setReservations(data);
      setLoading(false);
    });

    socket.on("connect_error", (err) => {
      setError("サーバーに接続できませんでした");
      setLoading(false);
    });

    return () => {
      socket.off("reservations_data");
      socket.off("connect_error");
    };
  }, []);

  const handleMarkDoneClick = (reservation) => {
    setCurrentReservation(reservation);
    setMarkDoneDialogOpen(true);
  };

  const handleConfirmMarkDone = () => {
    socket.emit("update_done_flg", { id: currentReservation.id, done_flg: 1 });
    setMarkDoneDialogOpen(false);
    setCurrentReservation(null);
  };

  const handleCancelMarkDone = () => {
    setMarkDoneDialogOpen(false);
    setCurrentReservation(null);
  };

  if (error) return <Typography sx={{ color: "red" }}>{error}</Typography>;
  if (loading) return <Typography>読み込み中...</Typography>;

  return (
    <>
      <Typography
        sx={{
          color: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
          fontWeight: "bold",
          my: 2,
        }}
      >
        予約一覧
      </Typography>

      {reservations.length === 0 ? (
        <Typography sx={{ color: "gray", textAlign: "center" }}>予約がありません</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>予約番号</TableCell>
                <TableCell>コンテンツ</TableCell>
                <TableCell>時間</TableCell>
                <TableCell>受付済み</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{contentMap[r.content_id]}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>
                    {r.done_flg ? (
                      "済"
                    ) : (
                      <Button variant="contained" onClick={() => handleMarkDoneClick(r)}>
                        受付済みにする
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 受付確認ダイアログ */}
      <Dialog open={markDoneDialogOpen} onClose={handleCancelMarkDone}>
        <DialogTitle>受付確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            以下の予約を受付済みにしますか？<br />
            時間: <strong>{currentReservation?.time}</strong><br />
            予約番号: <strong>{currentReservation?.id}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMarkDone}>キャンセル</Button>
          <Button onClick={handleConfirmMarkDone} color="primary">確定</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReservationTable;
