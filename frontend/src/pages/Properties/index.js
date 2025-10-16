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
import PropertyModal from "../../components/PropertyModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";

const reducer = (state, action) => {
  if (action.type === "LOAD_PROPERTIES") {
    const properties = action.payload;
    const newProperties = [];

    properties.forEach((property) => {
      const propertyIndex = state.findIndex((u) => u.id === property.id);
      if (propertyIndex !== -1) {
        state[propertyIndex] = property;
      } else {
        newProperties.push(property);
      }
    });

    return [...state, ...newProperties];
  }

  if (action.type === "UPDATE_PROPERTY") {
    const property = action.payload;
    const propertyIndex = state.findIndex((u) => u.id === property.id);

    if (propertyIndex !== -1) {
      state[propertyIndex] = property;
      return [...state];
    } else {
      return [property, ...state];
    }
  }

  if (action.type === "DELETE_PROPERTY") {
    const propertyId = action.payload;

    const propertyIndex = state.findIndex((u) => u.id === propertyId);
    if (propertyIndex !== -1) {
      state.splice(propertyIndex, 1);
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

const Properties = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [properties, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchProperties = async () => {
        try {
          const { data } = await api.get("/properties", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_PROPERTIES", payload: data.properties });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toast.error(err);
        }
      };
      fetchProperties();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const handleOpenPropertyModal = () => {
    setSelectedProperty(null);
    setPropertyModalOpen(true);
  };

  const handleClosePropertyModal = () => {
    setSelectedProperty(null);
    setPropertyModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setPropertyModalOpen(true);
  };

  const handleDeleteProperty = async (propertyId) => {
    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success("Imóvel deletado com sucesso");
      dispatch({ type: "DELETE_PROPERTY", payload: propertyId });
    } catch (err) {
      toast.error("Erro ao deletar imóvel");
    }
    setDeletingProperty(null);
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

  return (
    <MainContainer>
      <ConfirmationModal
        title="Deletar Imóvel"
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteProperty(deletingProperty.id)}
      >
        Tem certeza que deseja deletar este imóvel?
      </ConfirmationModal>
      <PropertyModal
        open={propertyModalOpen}
        onClose={handleClosePropertyModal}
        aria-labelledby="form-dialog-title"
        propertyId={selectedProperty && selectedProperty.id}
      />
      <MainHeader>
        <Title>Imóveis</Title>
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
            onClick={handleOpenPropertyModal}
          >
            Adicionar Imóvel
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
              <TableCell align="center">Título</TableCell>
              <TableCell align="center">Tipo</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Preço</TableCell>
              <TableCell align="center">Cidade</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell align="center">{property.title}</TableCell>
                  <TableCell align="center">{property.type}</TableCell>
                  <TableCell align="center">{property.status}</TableCell>
                  <TableCell align="center">
                    R$ {parseFloat(property.price).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell align="center">{property.city}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditProperty(property)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingProperty(property);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={6} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Properties;
