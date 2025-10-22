const getCurrentTimeString = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0"); // 0埋め（例: 09）
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

export default getCurrentTimeString