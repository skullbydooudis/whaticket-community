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
import { Autocomplete } from "@material-ui/lab";
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

const VisitModal = ({ open, onClose, visitId }) => {
  const classes = useStyles();
  const [visit, setVisit] = useState({
    propertyId: "",
    contactId: "",
    scheduledDate: "",
    status: "scheduled",
    notes: "",
    feedback: "",
    interested: false,
  });
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: propertiesData } = await api.get("/properties");
        setProperties(propertiesData.properties || []);

        const { data: contactsData } = await api.get("/contacts");
        setContacts(contactsData.contacts || []);
      } catch (err) {
        toast.error("Erro ao carregar dados");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchVisit = async () => {
      if (!visitId) return;
      try {
        const { data } = await api.get(`/visits/${visitId}`);
        setVisit({
          ...data,
          scheduledDate: data.scheduledDate
            ? new Date(data.scheduledDate).toISOString().slice(0, 16)
            : "",
        });
        if (data.property) {
          setSelectedProperty(data.property);
        }
        if (data.contact) {
          setSelectedContact(data.contact);
        }
      } catch (err) {
        toast.error("Erro ao carregar visita");
      }
    };
    fetchVisit();
  }, [visitId, open]);

  const handleClose = () => {
    onClose();
    setVisit({
      propertyId: "",
      contactId: "",
      scheduledDate: "",
      status: "scheduled",
      notes: "",
      feedback: "",
      interested: false,
    });
    setSelectedProperty(null);
    setSelectedContact(null);
  };

  const handleSaveVisit = async () => {
    try {
      const visitData = {
        ...visit,
        propertyId: selectedProperty?.id,
        contactId: selectedContact?.id,
      };

      if (visitId) {
        await api.put(`/visits/${visitId}`, visitData);
        toast.success("Visita atualizada com sucesso");
      } else {
        await api.post("/visits", visitData);
        toast.success("Visita agendada com sucesso");
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar visita");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        {visitId ? "Editar Visita" : "Agendar Visita"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={properties}
              getOptionLabel={(option) => option.title || ""}
              value={selectedProperty}
              onChange={(e, newValue) => {
                setSelectedProperty(newValue);
                setVisit({ ...visit, propertyId: newValue?.id || "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Imóvel"
                  variant="outlined"
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={contacts}
              getOptionLabel={(option) => option.name || ""}
              value={selectedContact}
              onChange={(e, newValue) => {
                setSelectedContact(newValue);
                setVisit({ ...visit, contactId: newValue?.id || "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contato"
                  variant="outlined"
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Data e Hora"
              type="datetime-local"
              value={visit.scheduledDate}
              onChange={(e) =>
                setVisit({ ...visit, scheduledDate: e.target.value })
              }
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={visit.status}
                onChange={(e) =>
                  setVisit({ ...visit, status: e.target.value })
                }
                label="Status"
              >
                <MenuItem value="scheduled">Agendada</MenuItem>
                <MenuItem value="completed">Realizada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
                <MenuItem value="no_show">Não Compareceu</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Observações"
              value={visit.notes}
              onChange={(e) =>
                setVisit({ ...visit, notes: e.target.value })
              }
              variant="outlined"
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Feedback do Cliente"
              value={visit.feedback}
              onChange={(e) =>
                setVisit({ ...visit, feedback: e.target.value })
              }
              variant="outlined"
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={visit.interested}
                  onChange={(e) =>
                    setVisit({ ...visit, interested: e.target.checked })
                  }
                  color="primary"
                />
              }
              label="Cliente Demonstrou Interesse"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSaveVisit} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VisitModal;
