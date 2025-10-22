import { Box, Typography, Grid, Card } from "@mui/material";
import { useState, useEffect } from "react";

const CallCards = ({ socket }) => {
  const [pastReservations, setPastReservations] = useState([]);
  const [currentReservations, setCurrentReservations] = useState([]);
  const [nextReservations, setNextReservations] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // 時刻文字列（"HH:MM"）を分単位に変換
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // 分単位を "HH:MM" に戻す
  const toTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // 30分単位に下方向へ丸める
  const roundDownTo30 = (timeStr) => {
    const totalMin = toMinutes(timeStr);
    const roundedMin = Math.floor(totalMin / 30) * 30;
    return toTimeStr(roundedMin);
  };

  // 15分単位に下方向へ丸める
const roundDownTo15 = (timeStr) => {
  const totalMin = toMinutes(timeStr);
  const roundedMin = Math.floor(totalMin / 15) * 15;
  return toTimeStr(roundedMin);
};

  useEffect(() => {
    socket.emit("get_time_slot");

    socket.on("time_slot", (data) => {
      setCurrentTime(data.current_time);
    });

    socket.on("reservations_data", (data) => {
      setLoading(false);

      const timeToUse = currentTime || new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0,5);
      const rounded = roundDownTo15(timeToUse);
      const baseMin = toMinutes(rounded);

      const currentStart = baseMin;
      const currentEnd = baseMin + 15; // 現在枠15分
      const nextStart = baseMin + 15;
      const nextEnd = baseMin + 30; // 次枠15分

      const past = [];
      const current = [];
      const next = [];

      data.forEach((r) => {
        const t = toMinutes(r.time);
        if (t < currentStart) past.push(r);
        else if (t >= currentStart && t < currentEnd) current.push(r);
        else if (t >= nextStart && t < nextEnd) next.push(r);
      });

      setPastReservations(past);
      setCurrentReservations(current);
      setNextReservations(next);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ 接続エラー:", err);
      setError("サーバーに接続できませんでした");
      setLoading(false);
    });

    return () => {
      socket.off("time_slot");
      socket.off("reservations_data");
      socket.off("connect_error");
    };
  }, [currentTime]);


  if (error) return <Typography sx={{ color: "red" }}>エラー: {error}</Typography>;
  if (loading) return <Typography>読み込み中...</Typography>;

  return (
    <>
      <Typography sx={{ color: "black", display: "flex", justifyContent: "center", fontSize: 20, fontWeight: "bold", my: 2 }}>
        予約一覧
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {/* 現在 */}
        <Card sx={{ width: "30%", height: 600, margin: 2 }}>
          <Box sx={{ bgcolor: "#fc3f3f", py: 1 }}>
            <Typography align="center" sx={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              お呼び出し中（現在）
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ p: 2 }}>
            {currentReservations.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <Typography sx={{ fontSize: 80 }}>{r.id}</Typography>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* 次 */}
        <Card sx={{ width: "30%", height: 600, margin: 2 }}>
          <Box sx={{ bgcolor: "#3f8efc", py: 1 }}>
            <Typography align="center" sx={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              次の時間帯
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ p: 2 }}>
            {nextReservations.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <Typography sx={{ fontSize: 80 }}>{r.id}</Typography>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* 過ぎた */}
        <Card sx={{ width: "30%", height: 600, margin: 2 }}>
          <Box sx={{ bgcolor: "#9e9e9e", py: 1 }}>
            <Typography align="center" sx={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              お呼び出し済（過去）
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ p: 2 }}>
            {pastReservations.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <Typography sx={{ fontSize: 80 }}>{r.id}</Typography>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Box>
    </>
  );
};

export default CallCards;
