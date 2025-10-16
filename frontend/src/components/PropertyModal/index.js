import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
}));

const PropertyModal = ({ open, onClose, propertyId }) => {
  const classes = useStyles();
  const [property, setProperty] = useState({
    title: "",
    description: "",
    type: "apartment",
    status: "available",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    parkingSpaces: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    publicUrl: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;
      try {
        const { data } = await api.get(`/properties/${propertyId}`);
        setProperty(data);
      } catch (err) {
        toast.error("Erro ao carregar imóvel");
      }
    };
    fetchProperty();
  }, [propertyId, open]);

  const handleClose = () => {
    onClose();
    setProperty({
      title: "",
      description: "",
      type: "apartment",
      status: "available",
      price: "",
      area: "",
      bedrooms: "",
      bathrooms: "",
      parkingSpaces: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      publicUrl: "",
      isActive: true,
    });
  };

  const handleSaveProperty = async () => {
    try {
      if (propertyId) {
        await api.put(`/properties/${propertyId}`, property);
        toast.success("Imóvel atualizado com sucesso");
      } else {
        await api.post("/properties", property);
        toast.success("Imóvel criado com sucesso");
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar imóvel");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        {propertyId ? "Editar Imóvel" : "Adicionar Imóvel"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Título"
              value={property.title}
              onChange={(e) => setProperty({ ...property, title: e.target.value })}
              variant="outlined"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição"
              value={property.description}
              onChange={(e) => setProperty({ ...property, description: e.target.value })}
              variant="outlined"
              fullWidth
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={property.type}
                onChange={(e) => setProperty({ ...property, type: e.target.value })}
                label="Tipo"
              >
                <MenuItem value="apartment">Apartamento</MenuItem>
                <MenuItem value="house">Casa</MenuItem>
                <MenuItem value="commercial">Comercial</MenuItem>
                <MenuItem value="land">Terreno</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={property.status}
                onChange={(e) => setProperty({ ...property, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="available">Disponível</MenuItem>
                <MenuItem value="sold">Vendido</MenuItem>
                <MenuItem value="rented">Alugado</MenuItem>
                <MenuItem value="reserved">Reservado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Preço"
              type="number"
              value={property.price}
              onChange={(e) => setProperty({ ...property, price: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Área (m²)"
              type="number"
              value={property.area}
              onChange={(e) => setProperty({ ...property, area: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Quartos"
              type="number"
              value={property.bedrooms}
              onChange={(e) => setProperty({ ...property, bedrooms: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Banheiros"
              type="number"
              value={property.bathrooms}
              onChange={(e) => setProperty({ ...property, bathrooms: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Vagas"
              type="number"
              value={property.parkingSpaces}
              onChange={(e) => setProperty({ ...property, parkingSpaces: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Endereço"
              value={property.address}
              onChange={(e) => setProperty({ ...property, address: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Cidade"
              value={property.city}
              onChange={(e) => setProperty({ ...property, city: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Estado"
              value={property.state}
              onChange={(e) => setProperty({ ...property, state: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="CEP"
              value={property.zipCode}
              onChange={(e) => setProperty({ ...property, zipCode: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="URL Pública"
              value={property.publicUrl}
              onChange={(e) => setProperty({ ...property, publicUrl: e.target.value })}
              variant="outlined"
              fullWidth
              helperText="URL única para página pública do imóvel"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={property.isActive}
                  onChange={(e) => setProperty({ ...property, isActive: e.target.checked })}
                  color="primary"
                />
              }
              label="Imóvel Ativo"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSaveProperty} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyModal;
