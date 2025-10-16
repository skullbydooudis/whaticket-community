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
  Typography,
  Divider,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";
import { addDays, format } from "date-fns";

const useStyles = makeStyles((theme) => ({
  section: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
}));

const ProposalModal = ({ open, onClose, proposalId }) => {
  const classes = useStyles();
  const [proposal, setProposal] = useState({
    leadId: "",
    propertyId: "",
    contactId: "",
    type: "sale",
    proposedValue: "",
    paymentMethod: "cash",
    downPayment: "",
    installments: "",
    validUntil: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "",
    termsConditions: "",
  });
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, propertiesRes, contactsRes] = await Promise.all([
          api.get("/leads").catch(() => ({ data: { leads: [] } })),
          api.get("/properties").catch(() => ({ data: { properties: [] } })),
          api.get("/contacts").catch(() => ({ data: { contacts: [] } })),
        ]);

        setLeads(leadsRes.data.leads || []);
        setProperties(propertiesRes.data.properties || []);
        setContacts(contactsRes.data.contacts || []);
      } catch (err) {
        console.error("Error loading data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) return;
      try {
        const { data } = await api.get(`/proposals/${proposalId}`);
        setProposal({
          ...data,
          validUntil: data.validUntil
            ? format(new Date(data.validUntil), "yyyy-MM-dd")
            : format(addDays(new Date(), 30), "yyyy-MM-dd"),
        });
        if (data.lead) setSelectedLead(data.lead);
        if (data.property) setSelectedProperty(data.property);
        if (data.contact) setSelectedContact(data.contact);
      } catch (err) {
        toast.error("Erro ao carregar proposta");
      }
    };
    fetchProposal();
  }, [proposalId, open]);

  const handleClose = () => {
    onClose();
    setProposal({
      leadId: "",
      propertyId: "",
      contactId: "",
      type: "sale",
      proposedValue: "",
      paymentMethod: "cash",
      downPayment: "",
      installments: "",
      validUntil: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      notes: "",
      termsConditions: "",
    });
    setSelectedLead(null);
    setSelectedProperty(null);
    setSelectedContact(null);
  };

  const handleSaveProposal = async () => {
    try {
      const proposalData = {
        ...proposal,
        leadId: selectedLead?.id,
        propertyId: selectedProperty?.id,
        contactId: selectedContact?.id,
      };

      if (proposalId) {
        await api.put(`/proposals/${proposalId}`, proposalData);
        toast.success("Proposta atualizada com sucesso");
      } else {
        await api.post("/proposals", proposalData);
        toast.success("Proposta criada com sucesso");
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar proposta");
    }
  };

  const calculateInstallmentValue = () => {
    if (!proposal.proposedValue || !proposal.installments) return 0;
    const remaining = proposal.proposedValue - (proposal.downPayment || 0);
    return remaining / proposal.installments;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{proposalId ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Informações Básicas</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={leads}
              getOptionLabel={(option) => option.name || ""}
              value={selectedLead}
              onChange={(e, newValue) => {
                setSelectedLead(newValue);
                setProposal({ ...proposal, leadId: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Lead" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={contacts}
              getOptionLabel={(option) => option.name || ""}
              value={selectedContact}
              onChange={(e, newValue) => {
                setSelectedContact(newValue);
                setProposal({ ...proposal, contactId: newValue?.id });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Contato (opcional)" variant="outlined" />
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
                setProposal({
                  ...proposal,
                  propertyId: newValue?.id,
                  proposedValue: newValue?.price || "",
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Imóvel" variant="outlined" required />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider className={classes.divider} />
            <Typography variant="h6">Detalhes Financeiros</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Tipo de Transação</InputLabel>
              <Select
                value={proposal.type}
                onChange={(e) => setProposal({ ...proposal, type: e.target.value })}
                label="Tipo de Transação"
              >
                <MenuItem value="sale">Venda</MenuItem>
                <MenuItem value="rent">Aluguel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Valor Proposto"
              type="number"
              value={proposal.proposedValue}
              onChange={(e) => setProposal({ ...proposal, proposedValue: e.target.value })}
              variant="outlined"
              fullWidth
              required
              InputProps={{
                startAdornment: "R$",
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select
                value={proposal.paymentMethod}
                onChange={(e) => setProposal({ ...proposal, paymentMethod: e.target.value })}
                label="Forma de Pagamento"
              >
                <MenuItem value="cash">À Vista</MenuItem>
                <MenuItem value="financing">Financiamento</MenuItem>
                <MenuItem value="mixed">Misto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {proposal.paymentMethod !== "cash" && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Entrada"
                  type="number"
                  value={proposal.downPayment}
                  onChange={(e) => setProposal({ ...proposal, downPayment: e.target.value })}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: "R$",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Parcelas"
                  type="number"
                  value={proposal.installments}
                  onChange={(e) => setProposal({ ...proposal, installments: e.target.value })}
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              {proposal.installments > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Valor da parcela: R${" "}
                    {calculateInstallmentValue().toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
              )}
            </>
          )}
          <Grid item xs={12}>
            <TextField
              label="Válido até"
              type="date"
              value={proposal.validUntil}
              onChange={(e) => setProposal({ ...proposal, validUntil: e.target.value })}
              variant="outlined"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider className={classes.divider} />
            <Typography variant="h6">Observações e Termos</Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observações Internas"
              value={proposal.notes}
              onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Termos e Condições"
              value={proposal.termsConditions}
              onChange={(e) => setProposal({ ...proposal, termsConditions: e.target.value })}
              variant="outlined"
              fullWidth
              multiline
              rows={5}
              placeholder="Digite os termos e condições da proposta..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSaveProposal} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposalModal;
