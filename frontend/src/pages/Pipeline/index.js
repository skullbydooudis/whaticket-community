import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Avatar,
  Box,
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import PhoneIcon from "@material-ui/icons/Phone";
import EmailIcon from "@material-ui/icons/Email";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const useStyles = makeStyles((theme) => ({
  pipelineContainer: {
    display: "flex",
    gap: theme.spacing(2),
    overflowX: "auto",
    padding: theme.spacing(2),
    height: "calc(100vh - 200px)",
  },
  column: {
    minWidth: 300,
    maxWidth: 300,
    display: "flex",
    flexDirection: "column",
  },
  columnHeader: {
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  columnTitle: {
    fontWeight: "bold",
    color: "#fff",
  },
  columnCount: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "50%",
    padding: "4px 8px",
    fontSize: "0.875rem",
    fontWeight: "bold",
    color: "#fff",
  },
  droppableArea: {
    flex: 1,
    overflowY: "auto",
    padding: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    borderRadius: theme.spacing(1),
    minHeight: 100,
  },
  leadCard: {
    marginBottom: theme.spacing(1),
    cursor: "pointer",
    "&:hover": {
      boxShadow: theme.shadows[4],
    },
  },
  leadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  leadInfo: {
    display: "flex",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  scoreChip: {
    fontWeight: "bold",
  },
  avatar: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    fontSize: "0.875rem",
  },
}));

const Pipeline = () => {
  const classes = useStyles();
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const { data } = await api.get("/pipeline");
      setPipeline(data.pipeline);
      setLoading(false);
    } catch (err) {
      toast.error("Erro ao carregar pipeline");
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStageId = destination.droppableId;

    try {
      await api.put(`/leads/${draggableId}/stage`, { stageId: newStageId });
      toast.success("Lead movido com sucesso");
      fetchPipeline();
    } catch (err) {
      toast.error("Erro ao mover lead");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#4caf50";
    if (score >= 50) return "#ff9800";
    return "#f44336";
  };

  const formatBudget = (min, max) => {
    if (!min && !max) return "Não informado";
    const minFormatted = min ? `R$ ${parseFloat(min).toLocaleString("pt-BR")}` : "";
    const maxFormatted = max ? `R$ ${parseFloat(max).toLocaleString("pt-BR")}` : "";
    if (min && max) return `${minFormatted} - ${maxFormatted}`;
    return minFormatted || maxFormatted;
  };

  if (loading) {
    return (
      <MainContainer>
        <MainHeader>
          <Title>Pipeline de Vendas</Title>
        </MainHeader>
        <Typography>Carregando...</Typography>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <MainHeader>
        <Title>Pipeline de Vendas</Title>
      </MainHeader>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={classes.pipelineContainer}>
          {pipeline.map((column) => (
            <div key={column.stage.id} className={classes.column}>
              <Paper
                className={classes.columnHeader}
                style={{ backgroundColor: column.stage.color }}
              >
                <Typography className={classes.columnTitle}>
                  {column.stage.name}
                </Typography>
                <span className={classes.columnCount}>{column.count}</span>
              </Paper>
              <Droppable droppableId={column.stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={classes.droppableArea}
                    style={{
                      backgroundColor: snapshot.isDraggingOver
                        ? "#e3f2fd"
                        : "#f5f5f5",
                    }}
                  >
                    {column.leads.map((lead, index) => (
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={classes.leadCard}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <CardContent>
                              <div className={classes.leadHeader}>
                                <Typography variant="subtitle1" style={{ fontWeight: "bold" }}>
                                  {lead.name}
                                </Typography>
                                <Chip
                                  label={lead.score}
                                  size="small"
                                  className={classes.scoreChip}
                                  style={{
                                    backgroundColor: getScoreColor(lead.score),
                                    color: "#fff",
                                  }}
                                />
                              </div>

                              <div className={classes.leadInfo}>
                                {lead.phone && (
                                  <Chip
                                    icon={<PhoneIcon />}
                                    label={lead.phone}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </div>

                              {lead.email && (
                                <div className={classes.leadInfo}>
                                  <Chip
                                    icon={<EmailIcon />}
                                    label={lead.email}
                                    size="small"
                                    variant="outlined"
                                  />
                                </div>
                              )}

                              <Typography
                                variant="body2"
                                color="textSecondary"
                                style={{ marginTop: 8 }}
                              >
                                {formatBudget(lead.budgetMin, lead.budgetMax)}
                              </Typography>

                              {lead.assignedUser && (
                                <Box mt={1} display="flex" alignItems="center" gap={1}>
                                  <Avatar className={classes.avatar}>
                                    {lead.assignedUser.name.charAt(0)}
                                  </Avatar>
                                  <Typography variant="caption">
                                    {lead.assignedUser.name}
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </MainContainer>
  );
};

export default Pipeline;
