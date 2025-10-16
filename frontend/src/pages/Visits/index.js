import React, { useState, useEffect, useReducer } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import VisitModal from "../../components/VisitModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { format, parseISO } from "date-fns";

const reducer = (state, action) => {
  if (action.type === "LOAD_VISITS") {
    const visits = action.payload;
    const newVisits = [];

    visits.forEach((visit) => {
      const visitIndex = state.findIndex((v) => v.id === visit.id);
      if (visitIndex !== -1) {
        state[visitIndex] = visit;
      } else {
        newVisits.push(visit);
      }
    });

    return [...state, ...newVisits];
  }

  if (action.type === "UPDATE_VISIT") {
    const visit = action.payload;
    const visitIndex = state.findIndex((v) => v.id === visit.id);

    if (visitIndex !== -1) {
      state[visitIndex] = visit;
      return [...state];
    } else {
      return [visit, ...state];
    }
  }

  if (action.type === "DELETE_VISIT") {
    const visitId = action.payload;

    const visitIndex = state.findIndex((v) => v.id === visitId);
    if (visitIndex !== -1) {
      state.splice(visitIndex, 1);
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
}));

const Visits = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [deletingVisit, setDeletingVisit] = useState(null);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [visits, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchVisits = async () => {
        try {
          const { data } = await api.get("/visits", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_VISITS", payload: data.visits });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toast.error("Erro ao carregar visitas");
        }
      };
      fetchVisits();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const handleOpenVisitModal = () => {
    setSelectedVisit(null);
    setVisitModalOpen(true);
  };

  const handleCloseVisitModal = () => {
    setSelectedVisit(null);
    setVisitModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditVisit = (visit) => {
    setSelectedVisit(visit);
    setVisitModalOpen(true);
  };

  const handleDeleteVisit = async (visitId) => {
    try {
      await api.delete(`/visits/${visitId}`);
      toast.success("Visita deletada com sucesso");
      dispatch({ type: "DELETE_VISIT", payload: visitId });
    } catch (err) {
      toast.error("Erro ao deletar visita");
    }
    setDeletingVisit(null);
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
      scheduled: "Agendada",
      completed: "Realizada",
      cancelled: "Cancelada",
      no_show: "Não Compareceu",
    };
    return labels[status] || status;
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Deletar Visita"
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteVisit(deletingVisit.id)}
      >
        Tem certeza que deseja deletar esta visita?
      </ConfirmationModal>
      <VisitModal
        open={visitModalOpen}
        onClose={handleCloseVisitModal}
        aria-labelledby="form-dialog-title"
        visitId={selectedVisit && selectedVisit.id}
      />
      <MainHeader>
        <Title>Visitas</Title>
        <MainHeader>
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenVisitModal}
          >
            Agendar Visita
          </Button>
        </MainHeader>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Imóvel</TableCell>
              <TableCell align="center">Contato</TableCell>
              <TableCell align="center">Data</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell align="center">
                    {visit.property?.title || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {visit.contact?.name || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {visit.scheduledDate
                      ? format(parseISO(visit.scheduledDate), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusLabel(visit.status)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditVisit(visit)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingVisit(visit);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={5} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Visits;
