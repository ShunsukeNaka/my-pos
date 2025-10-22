import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  ListItemButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const Purchase = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [discount, setDiscount] = useState(0); // ← 追加：割引額

  // バックエンドから商品データ取得
  useEffect(() => {
    fetch("http://127.0.0.1:54321/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handleClick = (product) => {
    if (!selectedProducts.some((p) => p.name === product.name)) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (productName, newQuantity) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.name === productName ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleDelete = (productName) => {
    setSelectedProducts(selectedProducts.filter((p) => p.name !== productName));
  };

  const handlePurchase = () => {
    setDialogOpen(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      const res = await fetch("http://127.0.0.1:54321/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedProducts.map((p) => ({
            id: p.id,
            quantity: p.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("購入が完了しました！");
        setSelectedProducts([]);
        setDiscount(0);

        // 最新在庫の再取得
        fetch("http://127.0.0.1:54321/products")
          .then((res) => res.json())
          .then((data) => setProducts(data));
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (err) {
      alert("購入処理に失敗しました。");
      console.error(err);
    } finally {
      setDialogOpen(false);
    }
  };

  const handleCancelPurchase = () => {
    setDialogOpen(false);
  };

  const handleDiscount = () => {
    if (discount === 0) {
      setDiscount(50);
    } else {
      alert("すでに割引が適用されています！");
    }
  };

  const totalPrice = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const finalPrice = Math.max(totalPrice - discount, 0);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        height: "100vh",
        padding: 4,
        gap: 6,
      }}
    >
      {/* 商品一覧 */}
      <Box
        sx={{
          flex: 1,
          maxWidth: "40%",
          bgcolor: "white",
          borderRadius: 3,
          boxShadow: 3,
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom>
          商品一覧
        </Typography>
        <List>
          {products.map((product) => (
            <ListItem key={product.id} sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleClick(product)}
                disabled={product.stock === 0}
              >
                <ListItemText
                  primary={product.name}
                  secondary={
                    product.stock === 0 ? (
                      <span style={{ color: "red" }}>在庫なし</span>
                    ) : (
                      `価格: ¥${product.price} ／ 在庫: ${product.stock}`
                    )
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* 選択中の商品 */}
      <Box
        sx={{
          width: "25%",
          bgcolor: "white",
          borderRadius: 3,
          boxShadow: 3,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            選択中の商品
          </Typography>
          <List>
            {selectedProducts.map((product) => (
              <ListItem
                key={product.name}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleDelete(product.name)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={product.name}
                  secondary={`金額: ¥${(product.price * product.quantity).toLocaleString()}`}
                />
                <Select
                  size="small"
                  value={product.quantity}
                  onChange={(e) =>
                    handleQuantityChange(product.name, e.target.value)
                  }
                  sx={{ ml: 2, width: 70 }}
                >
                  {[...Array(product.stock)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 合計・購入・割引ボタン */}
        {selectedProducts.length > 0 && (
          <Box
            sx={{
              mt: 2,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              合計: ¥{finalPrice.toLocaleString()}
              {discount > 0 && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: "red", ml: 1 }}
                >
                  （-¥{discount} 割引）
                </Typography>
              )}
            </Typography>

            <Button variant="outlined" color="secondary" onClick={handleDiscount}>
              割引
            </Button>

            <Button variant="contained" color="primary" onClick={handlePurchase}>
              購入
            </Button>
          </Box>
        )}

        {/* 確認ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleCancelPurchase}>
          <DialogTitle>購入確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              以下の商品を購入しますか？
              <List>
                {selectedProducts.map((p) => (
                  <ListItem key={p.name}>
                    <ListItemText
                      primary={`${p.name} × ${p.quantity}`}
                      secondary={`金額: ¥${(p.price * p.quantity).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
              合計金額: ¥{finalPrice.toLocaleString()}
              {discount > 0 && (
                <Typography variant="body2" color="red">
                  割引後価格（-¥{discount}）
                </Typography>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelPurchase}>キャンセル</Button>
            <Button onClick={handleConfirmPurchase} color="primary">
              確定
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Purchase;
