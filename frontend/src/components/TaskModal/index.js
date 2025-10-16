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
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";
import { format, addDays } from "date-fns";

const useStyles = makeStyles((theme) => ({
  section: {
    marginTop: theme.spacing(2),
  },
}));

const TaskModal = ({ open, onClose, taskId }) => {
  const classes = useStyles();
  const [task, setTask] = useState({
    title: "",
    description: "",
    type: "call",
    priority: "medium",
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    leadId: "",
    propertyId: "",
    contactId: "",
    assignedTo: null,
  });
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, propertiesRes, contactsRes, usersRes] = await Promise.all([
          api.get("/leads").catch(() => ({ data: { leads: [] } })),
          api.get("/properties").catch(() => ({ data: { properties: [] } })),
          api.get("/contacts").catch(() => ({ data: { contacts: [] } })),
          api.get("/users").catch(() => ({ data: { users: [] } })),
        ]);

        setLeads(leadsRes.data.leads || []);
        setProperties(propertiesRes.data.properties || []);
        setContacts(contactsRes.data.contacts || []);
        setUsers(usersRes.data.users || []);
      } catch (err) {
        console.error("Error loading data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      try {
        const { data } = await api.get(`/tasks/${taskId}`);
        setTask({
          ...data,
          dueDate: data.dueDate
            ? format(new Date(data.dueDate), "yyyy-MM-dd'T'HH:mm")
            : format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        });
        if (data.lead) setSelectedLead(data.lead);
        if (data.property) setSelectedProperty(data.property);
        if (data.contact) setSelectedContact(data.contact);
        if (data.assignedUser) setSelectedUser(data.assignedUser);
      } catch (err) {
        toast.error("Erro ao carregar tarefa");
      }
    };
    fetchTask();
  }, [taskId, open]);

  const handleClose = () => {
    onClose();
    setTask({
      title: "",
      description: "",
      type: "call",
      priority: "medium",
      dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      leadId: "",
      propertyId: "",
      contactId: "",
      assignedTo: null,
    });
    setSelectedLead(null);
    setSelectedProperty(null);
    setSelectedContact(null);
    setSelectedUser(null);
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...task,
        leadId: selectedLead?.id,
        propertyId: selectedProperty?.id,
        contactId: selectedContact?.id,
        assignedTo: selectedUser?.id,
      };

      if (taskId) {
        await api.put(`/tasks/${taskId}`, taskData);
        toast.success("Tarefa atualizada com sucesso");
      } else {
        await api.post("/tasks", taskData);
        toast.success("Tarefa criada com sucesso");
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar tarefa");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{taskId ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Título"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              variant="outlined"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={task.type}
                onChange={(e) => setTask({ ...task, type: e.target.value })}
                label="Tipo"
              >
                <MenuItem value="call">Ligação</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="visit">Visita</MenuItem>
                <MenuItem value="meeting">Reunião</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value })}
                label="Prioridade"
              >
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="urgent">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Data e Hora de Vencimento"
              type="datetime-local"
              value={task.dueDate}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.name || ""}
              value={selectedUser}
              onChange={(e, newValue) => {
                setSelectedUser(newValue);
                setTask({ ...task, assignedTo: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Responsável" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={leads}
              getOptionLabel={(option) => option.name || ""}
              value={selectedLead}
              onChange={(e, newValue) => {
                setSelectedLead(newValue);
                setTask({ ...task, leadId: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Lead relacionado (opcional)" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={properties}
              getOptionLabel={(option) => option.title || ""}
              value={selectedProperty}
              onChange={(e, newValue) => {
                setSelectedProperty(newValue);
                setTask({ ...task, propertyId: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Imóvel relacionado (opcional)" variant="outlined" />
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
                setTask({ ...task, contactId: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Contato relacionado (opcional)" variant="outlined" />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSaveTask} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;
