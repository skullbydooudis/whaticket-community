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
  Slider,
  Typography,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  section: {
    marginTop: theme.spacing(2),
  },
}));

const LeadModal = ({ open, onClose, leadId }) => {
  const classes = useStyles();
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website",
    status: "new",
    score: 50,
    budgetMin: "",
    budgetMax: "",
    propertyType: "",
    preferredLocations: [],
    notes: "",
    assignedTo: null,
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users");
        setUsers(data.users || []);
      } catch (err) {
        console.error("Error loading users");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;
      try {
        const { data } = await api.get(`/leads/${leadId}`);
        setLead(data);
        if (data.assignedUser) {
          setSelectedUser(data.assignedUser);
        }
      } catch (err) {
        toast.error("Erro ao carregar lead");
      }
    };
    fetchLead();
  }, [leadId, open]);

  const handleClose = () => {
    onClose();
    setLead({
      name: "",
      email: "",
      phone: "",
      source: "website",
      status: "new",
      score: 50,
      budgetMin: "",
      budgetMax: "",
      propertyType: "",
      preferredLocations: [],
      notes: "",
      assignedTo: null,
    });
    setSelectedUser(null);
  };

  const handleSaveLead = async () => {
    try {
      const leadData = {
        ...lead,
        assignedTo: selectedUser?.id,
      };

      if (leadId) {
        await api.put(`/leads/${leadId}`, leadData);
        toast.success("Lead atualizado com sucesso");
      } else {
        await api.post("/leads", leadData);
        toast.success("Lead criado com sucesso");
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar lead");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{leadId ? "Editar Lead" : "Adicionar Lead"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Informações Básicas</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Nome"
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
              variant="outlined"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              type="email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Telefone"
              value={lead.phone}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Origem</InputLabel>
              <Select
                value={lead.source}
                onChange={(e) => setLead({ ...lead, source: e.target.value })}
                label="Origem"
              >
                <MenuItem value="website">Website</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="referral">Indicação</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="google">Google</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} className={classes.section}>
            <Typography variant="h6">Qualificação</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={lead.status}
                onChange={(e) => setLead({ ...lead, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="new">Novo</MenuItem>
                <MenuItem value="contacted">Contatado</MenuItem>
                <MenuItem value="qualified">Qualificado</MenuItem>
                <MenuItem value="negotiating">Negociando</MenuItem>
                <MenuItem value="won">Ganho</MenuItem>
                <MenuItem value="lost">Perdido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.name || ""}
              value={selectedUser}
              onChange={(e, newValue) => {
                setSelectedUser(newValue);
                setLead({ ...lead, assignedTo: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Responsável" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>Score do Lead: {lead.score}</Typography>
            <Slider
              value={lead.score}
              onChange={(e, newValue) => setLead({ ...lead, score: newValue })}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} className={classes.section}>
            <Typography variant="h6">Interesses</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Orçamento Mínimo"
              type="number"
              value={lead.budgetMin}
              onChange={(e) => setLead({ ...lead, budgetMin: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Orçamento Máximo"
              type="number"
              value={lead.budgetMax}
              onChange={(e) => setLead({ ...lead, budgetMax: e.target.value })}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Tipo de Imóvel</InputLabel>
              <Select
                value={lead.propertyType}
                onChange={(e) => setLead({ ...lead, propertyType: e.target.value })}
                label="Tipo de Imóvel"
              >
                <MenuItem value="">Nenhum</MenuItem>
                <MenuItem value="apartment">Apartamento</MenuItem>
                <MenuItem value="house">Casa</MenuItem>
                <MenuItem value="commercial">Comercial</MenuItem>
                <MenuItem value="land">Terreno</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Observações"
              value={lead.notes}
              onChange={(e) => setLead({ ...lead, notes: e.target.value })}
              variant="outlined"
              fullWidth
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSaveLead} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadModal;
