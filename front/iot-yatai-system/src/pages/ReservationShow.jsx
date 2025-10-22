import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import ReservationTable from "../component/reservationsTable";

const socket = io("http://127.0.0.1:54321");

const ReservationShow = () => {
  return (
    <>
        <ReservationTable socket={socket}/>
    </>
  );
};

export default ReservationShow;
