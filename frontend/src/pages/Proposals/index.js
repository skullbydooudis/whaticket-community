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
  Tooltip,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import SendIcon from "@material-ui/icons/Send";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import PictureAsPdfIcon from "@material-ui/icons/PictureAsPdf";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import ProposalModal from "../../components/ProposalModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { format, parseISO } from "date-fns";

const reducer = (state, action) => {
  if (action.type === "LOAD_PROPOSALS") {
    const proposals = action.payload;
    const newProposals = [];

    proposals.forEach((proposal) => {
      const proposalIndex = state.findIndex((p) => p.id === proposal.id);
      if (proposalIndex !== -1) {
        state[proposalIndex] = proposal;
      } else {
        newProposals.push(proposal);
      }
    });

    return [...state, ...newProposals];
  }

  if (action.type === "UPDATE_PROPOSAL") {
    const proposal = action.payload;
    const proposalIndex = state.findIndex((p) => p.id === proposal.id);

    if (proposalIndex !== -1) {
      state[proposalIndex] = proposal;
      return [...state];
    } else {
      return [proposal, ...state];
    }
  }

  if (action.type === "DELETE_PROPOSAL") {
    const proposalId = action.payload;
    const proposalIndex = state.findIndex((p) => p.id === proposalId);
    if (proposalIndex !== -1) {
      state.splice(proposalIndex, 1);
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
  actionButtons: {
    display: "flex",
    gap: theme.spacing(0.5),
  },
}));

const Proposals = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [deletingProposal, setDeletingProposal] = useState(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [proposals, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
  }, [searchParam, statusFilter]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchProposals = async () => {
        try {
          const { data } = await api.get("/proposals", {
            params: { status: statusFilter },
          });
          dispatch({ type: "LOAD_PROPOSALS", payload: data.proposals });
          setLoading(false);
        } catch (err) {
          toast.error("Erro ao carregar propostas");
        }
      };
      fetchProposals();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, statusFilter]);

  const handleOpenProposalModal = () => {
    setSelectedProposal(null);
    setProposalModalOpen(true);
  };

  const handleCloseProposalModal = () => {
    setSelectedProposal(null);
    setProposalModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditProposal = (proposal) => {
    setSelectedProposal(proposal);
    setProposalModalOpen(true);
  };

  const handleDeleteProposal = async (proposalId) => {
    try {
      await api.delete(`/proposals/${proposalId}`);
      toast.success("Proposta deletada com sucesso");
      dispatch({ type: "DELETE_PROPOSAL", payload: proposalId });
    } catch (err) {
      toast.error("Erro ao deletar proposta");
    }
    setDeletingProposal(null);
  };

  const handleSendProposal = async (proposalId) => {
    try {
      await api.put(`/proposals/${proposalId}/status`, { status: "sent" });
      toast.success("Proposta enviada com sucesso");
      const { data } = await api.get(`/proposals/${proposalId}`);
      dispatch({ type: "UPDATE_PROPOSAL", payload: data });
    } catch (err) {
      toast.error("Erro ao enviar proposta");
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      await api.put(`/proposals/${proposalId}/status`, { status: "accepted" });
      toast.success("Proposta aceita!");
      const { data } = await api.get(`/proposals/${proposalId}`);
      dispatch({ type: "UPDATE_PROPOSAL", payload: data });
    } catch (err) {
      toast.error("Erro ao aceitar proposta");
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await api.put(`/proposals/${proposalId}/status`, { status: "rejected" });
      toast.success("Proposta rejeitada");
      const { data } = await api.get(`/proposals/${proposalId}`);
      dispatch({ type: "UPDATE_PROPOSAL", payload: data });
    } catch (err) {
      toast.error("Erro ao rejeitar proposta");
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: "Rascunho",
      sent: "Enviada",
      viewed: "Visualizada",
      negotiating: "Negociando",
      accepted: "Aceita",
      rejected: "Rejeitada",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "default",
      sent: "primary",
      viewed: "secondary",
      negotiating: "default",
      accepted: "primary",
      rejected: "secondary",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  const formatCurrency = (value) => {
    return `R$ ${parseFloat(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Deletar Proposta"
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteProposal(deletingProposal.id)}
      >
        Tem certeza que deseja deletar esta proposta?
      </ConfirmationModal>
      <ProposalModal
        open={proposalModalOpen}
        onClose={handleCloseProposalModal}
        aria-labelledby="form-dialog-title"
        proposalId={selectedProposal && selectedProposal.id}
      />
      <MainHeader>
        <Title>Propostas Comerciais</Title>
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
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="sent">Enviada</MenuItem>
                <MenuItem value="viewed">Visualizada</MenuItem>
                <MenuItem value="negotiating">Negociando</MenuItem>
                <MenuItem value="accepted">Aceita</MenuItem>
                <MenuItem value="rejected">Rejeitada</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Button variant="contained" color="primary" onClick={handleOpenProposalModal}>
            Nova Proposta
          </Button>
        </MainHeader>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Número</TableCell>
              <TableCell align="center">Lead</TableCell>
              <TableCell align="center">Imóvel</TableCell>
              <TableCell align="center">Tipo</TableCell>
              <TableCell align="center">Valor</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Validade</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell align="center">
                    <strong>{proposal.proposalNumber}</strong>
                  </TableCell>
                  <TableCell align="center">
                    {proposal.lead?.name || proposal.contact?.name || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {proposal.property?.title || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {proposal.type === "sale" ? "Venda" : "Aluguel"}
                  </TableCell>
                  <TableCell align="center">
                    {formatCurrency(proposal.proposedValue)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(proposal.status)}
                      color={getStatusColor(proposal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {proposal.validUntil
                      ? format(parseISO(proposal.validUntil), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <div className={classes.actionButtons}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleEditProposal(proposal)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditProposal(proposal)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {proposal.status === "draft" && (
                        <Tooltip title="Enviar">
                          <IconButton
                            size="small"
                            onClick={() => handleSendProposal(proposal.id)}
                            color="primary"
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {["sent", "viewed", "negotiating"].includes(proposal.status) && (
                        <>
                          <Tooltip title="Aceitar">
                            <IconButton
                              size="small"
                              onClick={() => handleAcceptProposal(proposal.id)}
                              style={{ color: "#4caf50" }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rejeitar">
                            <IconButton
                              size="small"
                              onClick={() => handleRejectProposal(proposal.id)}
                              style={{ color: "#f44336" }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Gerar PDF">
                        <IconButton size="small" color="secondary">
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deletar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setConfirmModalOpen(true);
                            setDeletingProposal(proposal);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </div>
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

export default Proposals;
