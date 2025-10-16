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
  Tabs,
  Tab,
  Box,
  Typography,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import TaskModal from "../../components/TaskModal";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from "date-fns";

const reducer = (state, action) => {
  if (action.type === "LOAD_TASKS") {
    return action.payload;
  }

  if (action.type === "UPDATE_TASK") {
    const task = action.payload;
    const taskIndex = state.findIndex((t) => t.id === task.id);

    if (taskIndex !== -1) {
      state[taskIndex] = task;
      return [...state];
    } else {
      return [task, ...state];
    }
  }

  if (action.type === "DELETE_TASK") {
    const taskId = action.payload;
    const taskIndex = state.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      state.splice(taskIndex, 1);
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
  tabs: {
    marginBottom: theme.spacing(2),
  },
  priorityChip: {
    fontWeight: "bold",
  },
  overdueCell: {
    backgroundColor: "#ffebee",
  },
  todayCell: {
    backgroundColor: "#fff3e0",
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Tasks = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [tasks, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    fetchTasks();
  }, [priorityFilter, typeFilter, tabValue]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const statusParam = tabValue === 0 ? "pending" : tabValue === 1 ? "in_progress" : "completed";
      const { data } = await api.get("/tasks", {
        params: {
          status: statusParam,
          priority: priorityFilter,
          type: typeFilter,
        },
      });
      dispatch({ type: "LOAD_TASKS", payload: data.tasks || [] });
      setLoading(false);
    } catch (err) {
      toast.error("Erro ao carregar tarefas");
      setLoading(false);
    }
  };

  const handleOpenTaskModal = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setTaskModalOpen(false);
    fetchTasks();
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Tarefa deletada com sucesso");
      dispatch({ type: "DELETE_TASK", payload: taskId });
    } catch (err) {
      toast.error("Erro ao deletar tarefa");
    }
    setDeletingTask(null);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      toast.success("Tarefa concluída!");
      fetchTasks();
    } catch (err) {
      toast.error("Erro ao concluir tarefa");
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "#f44336",
      high: "#ff9800",
      medium: "#2196f3",
      low: "#4caf50",
    };
    return colors[priority] || "#9e9e9e";
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: "Urgente",
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };
    return labels[priority] || priority;
  };

  const getTypeLabel = (type) => {
    const labels = {
      call: "Ligação",
      email: "Email",
      visit: "Visita",
      meeting: "Reunião",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return "Hoje";
    if (isTomorrow(parsedDate)) return "Amanhã";
    if (isPast(parsedDate)) return `Atrasada - ${format(parsedDate, "dd/MM/yyyy")}`;
    return format(parsedDate, "dd/MM/yyyy");
  };

  const getRowClass = (task) => {
    if (!task.dueDate) return "";
    const dueDate = parseISO(task.dueDate);
    if (isPast(dueDate) && task.status !== "completed") return classes.overdueCell;
    if (isToday(dueDate)) return classes.todayCell;
    return "";
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchParam) return true;
    const searchLower = searchParam.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.lead?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <MainContainer>
      <ConfirmationModal
        title="Deletar Tarefa"
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteTask(deletingTask.id)}
      >
        Tem certeza que deseja deletar esta tarefa?
      </ConfirmationModal>
      <TaskModal
        open={taskModalOpen}
        onClose={handleCloseTaskModal}
        aria-labelledby="form-dialog-title"
        taskId={selectedTask && selectedTask.id}
      />
      <MainHeader>
        <Title>Tarefas</Title>
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
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Prioridade"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="urgent">Urgente</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="low">Baixa</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" style={{ minWidth: 150 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="call">Ligação</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="visit">Visita</MenuItem>
                <MenuItem value="meeting">Reunião</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Button variant="contained" color="primary" onClick={handleOpenTaskModal}>
            Nova Tarefa
          </Button>
        </MainHeader>
      </MainHeader>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        className={classes.tabs}
      >
        <Tab label="Pendentes" />
        <Tab label="Em Andamento" />
        <Tab label="Concluídas" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Paper className={classes.mainPaper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Título</TableCell>
                <TableCell align="center">Tipo</TableCell>
                <TableCell align="center">Prioridade</TableCell>
                <TableCell align="center">Vencimento</TableCell>
                <TableCell align="center">Relacionado</TableCell>
                <TableCell align="center">Responsável</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className={getRowClass(task)}>
                    <TableCell align="center">
                      <strong>{task.title}</strong>
                    </TableCell>
                    <TableCell align="center">{getTypeLabel(task.type)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getPriorityLabel(task.priority)}
                        size="small"
                        className={classes.priorityChip}
                        style={{
                          backgroundColor: getPriorityColor(task.priority),
                          color: "#fff",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{formatDate(task.dueDate)}</TableCell>
                    <TableCell align="center">
                      {task.lead?.name || task.property?.title || "-"}
                    </TableCell>
                    <TableCell align="center">{task.assignedUser?.name || "-"}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleCompleteTask(task.id)}
                        style={{ color: "#4caf50" }}
                        title="Concluir"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditTask(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setConfirmModalOpen(true);
                          setDeletingTask(task);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && <TableRowSkeleton columns={7} />}
                {!loading && filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">Nenhuma tarefa encontrada</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </>
            </TableBody>
          </Table>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper className={classes.mainPaper} variant="outlined">
          <Typography>Tarefas em andamento...</Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper className={classes.mainPaper} variant="outlined">
          <Typography>Tarefas concluídas...</Typography>
        </Paper>
      </TabPanel>
    </MainContainer>
  );
};

export default Tasks;
