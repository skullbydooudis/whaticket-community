import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
} from "@material-ui/core";
import HomeIcon from "@material-ui/icons/Home";
import HotelIcon from "@material-ui/icons/Hotel";
import BathtubIcon from "@material-ui/icons/Bathtub";
import DriveEtaIcon from "@material-ui/icons/DriveEta";
import api from "../../services/api";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    padding: theme.spacing(4),
    backgroundColor: "#f5f5f5",
  },
  paper: {
    padding: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  priceTag: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  features: {
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  section: {
    marginTop: theme.spacing(3),
  },
}));

const PropertyPublic = () => {
  const classes = useStyles();
  const { publicUrl } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/public/properties/${publicUrl}`);
        setProperty(data);
      } catch (err) {
        toast.error("Imóvel não encontrado");
      } finally {
        setLoading(false);
      }
    };
    if (publicUrl) {
      fetchProperty();
    }
  }, [publicUrl]);

  if (loading) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Typography variant="h5">Carregando...</Typography>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Typography variant="h5">Imóvel não encontrado</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={classes.root}>
      <Paper className={classes.paper}>
        <Box className={classes.header}>
          <Typography variant="h3" gutterBottom>
            {property.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {property.address}, {property.city} - {property.state}
          </Typography>
          <Box mt={2}>
            <Chip
              label={property.type === "apartment" ? "Apartamento" : property.type}
              color="primary"
            />
            <Chip
              label={property.status === "available" ? "Disponível" : property.status}
              color="secondary"
              style={{ marginLeft: 8 }}
            />
          </Box>
        </Box>

        <Divider />

        <Box className={classes.section}>
          <Typography className={classes.priceTag}>
            R$ {parseFloat(property.price).toLocaleString("pt-BR")}
          </Typography>
        </Box>

        <Box className={classes.features}>
          {property.area && (
            <Box className={classes.featureItem}>
              <HomeIcon />
              <Typography>{property.area} m²</Typography>
            </Box>
          )}
          {property.bedrooms > 0 && (
            <Box className={classes.featureItem}>
              <HotelIcon />
              <Typography>{property.bedrooms} Quartos</Typography>
            </Box>
          )}
          {property.bathrooms > 0 && (
            <Box className={classes.featureItem}>
              <BathtubIcon />
              <Typography>{property.bathrooms} Banheiros</Typography>
            </Box>
          )}
          {property.parkingSpaces > 0 && (
            <Box className={classes.featureItem}>
              <DriveEtaIcon />
              <Typography>{property.parkingSpaces} Vagas</Typography>
            </Box>
          )}
        </Box>

        {property.description && (
          <Box className={classes.section}>
            <Typography variant="h5" gutterBottom>
              Descrição
            </Typography>
            <Typography variant="body1" paragraph>
              {property.description}
            </Typography>
          </Box>
        )}

        {property.user && (
          <Box className={classes.section}>
            <Divider style={{ marginBottom: 16 }} />
            <Typography variant="h6">Contato</Typography>
            <Typography variant="body1">
              Corretor: {property.user.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Email: {property.user.email}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PropertyPublic;
