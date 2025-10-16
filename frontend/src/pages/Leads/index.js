import React, { useState, useEffect, useReducer } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import PhoneIcon from "@material-ui/icons/Phone";
import EmailIcon from "@material-ui/icons/Email";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import LeadModal from "../../components/LeadModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { format, parseISO } from "date-fns";

const reducer = (state, action) => {
  if (action.type === "LOAD_LEADS") {
    const leads = action.payload;
    const newLeads = [];

    leads.forEach((lead) => {
      const leadIndex = state.findIndex((l) => l.id === lead.id);
      if (leadIndex !== -1) {
        state[leadIndex] = lead;
      } else {
        newLeads.push(lead);
      }
    });

    return [...state, ...newLeads];
  }

  if (action.type === "UPDATE_LEAD") {
    const lead = action.payload;
    const leadIndex = state.findIndex((l) => l.id === lead.id);

    if (leadIndex !== -1) {
      state[leadIndex] = lead;
      return [...state];
    } else {
      return [lead, ...state];
    }
  }

  if (action.type === "DELETE_LEAD") {
    const leadId = action.payload;
    const leadIndex = state.findIndex((l) => l.id === leadId);
    if (leadIndex !== -1) {
      state.splice(leadIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  filters: {
    display: "flex",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  scoreChip: {
    fontWeight: "bold",
  },
}));

const Leads = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [leads, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, statusFilter, sourceFilter]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchLeads = async () => {
        try {
          const { data } = await api.get("/leads", {
            params: { searchParam, pageNumber, status: statusFilter, source: sourceFilter },
          });
          dispatch({ type: "LOAD_LEADS", payload: data.leads });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toast.error("Erro ao carregar leads");
        }
      };
      fetchLeads();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, statusFilter, sourceFilter]);

  const handleOpenLeadModal = () => {
    setSelectedLead(null);
    setLeadModalOpen(true);
  };

  const handleCloseLeadModal = () => {
    setSelectedLead(null);
    setLeadModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setLeadModalOpen(true);
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await api.delete(`/leads/${leadId}`);
      toast.success("Lead deletado com sucesso");
      dispatch({ type: "DELETE_LEAD", payload: leadId });
    } catch (err) {
      toast.error("Erro ao deletar lead");
    }
    setDeletingLead(null);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: "Novo",
      contacted: "Contatado",
      qualified: "Qualificado",
      negotiating: "Negociando",
      won: "Ganho",
      lost: "Perdido",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "default",
      contacted: "primary",
      qualified: "secondary",
      negotiating: "default",
      won: "primary",
      lost: "secondary",
    };
    return colors[status] || "default";
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#4caf50";
    if (score >= 50) return "#ff9800";
    return "#f44336";
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Deletar Lead"
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteLead(deletingLead.id)}
      >
        Tem certeza que deseja deletar este lead?
      </ConfirmationModal>
      <LeadModal
        open={leadModalOpen}
        onClose={handleCloseLeadModal}
        aria-labelledby="form-dialog-title"
        leadId={selectedLead && selectedLead.id}
      />
      <MainHeader>
        <Title>Leads</Title>
        <MainHeader>
          <div className={classes.filters}>
            <TextField
              placeholder="Pesquisar"
              type="search"
              value={searchParam}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: "gray" }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl variant="outlined" style={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="new">Novo</MenuItem>
                <MenuItem value="contacted">Contatado</MenuItem>
                <MenuItem value="qualified">Qualificado</MenuItem>
                <MenuItem value="negotiating">Negociando</MenuItem>
                <MenuItem value="won">Ganho</MenuItem>
                <MenuItem value="lost">Perdido</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" style={{ minWidth: 150 }}>
              <InputLabel>Origem</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                label="Origem"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="website">Website</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="referral">Indicação</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Button variant="contained" color="primary" onClick={handleOpenLeadModal}>
            Adicionar Lead
          </Button>
        </MainHeader>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Nome</TableCell>
              <TableCell align="center">Contato</TableCell>
              <TableCell align="center">Origem</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Orçamento</TableCell>
              <TableCell align="center">Responsável</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell align="center">{lead.name}</TableCell>
                  <TableCell align="center">
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      {lead.phone && (
                        <IconButton size="small" title={lead.phone}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      )}
                      {lead.email && (
                        <IconButton size="small" title={lead.email}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="center">{lead.source}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(lead.status)}
                      color={getStatusColor(lead.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={lead.score}
                      size="small"
                      className={classes.scoreChip}
                      style={{ backgroundColor: getScoreColor(lead.score), color: "#fff" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {lead.budgetMin && lead.budgetMax
                      ? `R$ ${parseFloat(lead.budgetMin).toLocaleString("pt-BR")} - R$ ${parseFloat(lead.budgetMax).toLocaleString("pt-BR")}`
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {lead.assignedUser?.name || "-"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEditLead(lead)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingLead(lead);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={8} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Leads;
